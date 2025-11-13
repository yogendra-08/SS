import express from 'express';
import { body, validationResult } from 'express-validator';
import { executeQuery, getOne } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest, OrderCreate } from '../types';

const router = express.Router();

// Get user's orders
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    const orders = await executeQuery(`
      SELECT * FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);

    // Get order items for each order
    for (let order of orders) {
      const orderItems = await executeQuery(`
        SELECT 
          oi.*, p.name, p.image, p.category
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = orderItems;
    }

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: { orders }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching orders'
    });
  }
});

// Create new order (checkout)
const createOrderValidation = [
  body('shipping_address').trim().isLength({ min: 10, max: 200 }).withMessage('Shipping address must be between 10-200 characters'),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
  body('items.*.price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number')
];

router.post('/', authenticateToken, createOrderValidation, async (req: AuthenticatedRequest, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user?.userId;
    const { shipping_address, items }: OrderCreate = req.body;

    // Calculate total amount
    let totalAmount = 0;
    const validatedItems = [];

    // Validate each item and calculate total
    for (const item of items) {
      const product = await getOne('SELECT * FROM products WHERE id = ?', [item.product_id]);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}. Only ${product.stock} available.`
        });
      }

      // Use current product price instead of submitted price for security
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Start transaction
    const connection = await executeQuery('START TRANSACTION');

    try {
      // Create order
      const orderResult = await executeQuery(
        'INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES (?, ?, ?, ?)',
        [userId, totalAmount, 'pending', shipping_address]
      );

      const orderId = orderResult.insertId;

      // Create order items and update product stock
      for (const item of validatedItems) {
        // Insert order item
        await executeQuery(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price]
        );

        // Update product stock
        await executeQuery(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Clear user's cart
      await executeQuery('DELETE FROM cart WHERE user_id = ?', [userId]);

      // Commit transaction
      await executeQuery('COMMIT');

      // Get the created order with items
      const newOrder = await getOne('SELECT * FROM orders WHERE id = ?', [orderId]);
      const orderItems = await executeQuery(`
        SELECT 
          oi.*, p.name, p.image, p.category
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [orderId]);

      newOrder.items = orderItems;

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: { order: newOrder }
      });
    } catch (error) {
      // Rollback transaction on error
      await executeQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating order'
    });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const orderId = parseInt(req.params.id);

    const order = await getOne(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const orderItems = await executeQuery(`
      SELECT 
        oi.*, p.name, p.image, p.category
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    order.items = orderItems;

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching order'
    });
  }
});

export default router;
