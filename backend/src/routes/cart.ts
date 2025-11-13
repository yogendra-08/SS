import express from 'express';
import { body, validationResult } from 'express-validator';
import { executeQuery, getOne } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { CartItem, CartItemCreate, AuthenticatedRequest } from '../types';

const router = express.Router();

// Get user's cart items
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    const cartItems = await executeQuery(`
      SELECT 
        c.id, c.user_id, c.product_id, c.quantity, c.created_at, c.updated_at,
        p.name, p.description, p.price, p.category, p.image, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId]);

    // Calculate total
    const total = cartItems.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Cart items retrieved successfully',
      data: {
        items: cartItems,
        total: parseFloat(total.toFixed(2)),
        count: cartItems.length
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching cart'
    });
  }
});

// Add item to cart
const addToCartValidation = [
  body('product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
];

router.post('/', authenticateToken, addToCartValidation, async (req: AuthenticatedRequest, res) => {
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
    const { product_id, quantity }: CartItemCreate = req.body;

    // Check if product exists and has enough stock
    const product = await getOne('SELECT * FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await getOne(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more items. Only ${product.stock} available in stock`
        });
      }

      await executeQuery(
        'UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?',
        [newQuantity, existingCartItem.id]
      );

      res.status(200).json({
        success: true,
        message: 'Cart item quantity updated successfully'
      });
    } else {
      // Add new item to cart
      await executeQuery(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, product_id, quantity]
      );

      res.status(201).json({
        success: true,
        message: 'Item added to cart successfully'
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding to cart'
    });
  }
});

// Update cart item quantity
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const cartItemId = parseInt(req.params.id);
    const { quantity } = req.body;

    if (!quantity || quantity < 1 || quantity > 10) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be between 1 and 10'
      });
    }

    // Check if cart item belongs to user
    const cartItem = await getOne(
      'SELECT c.*, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.user_id = ?',
      [cartItemId, userId]
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    if (quantity > cartItem.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${cartItem.stock} items available in stock`
      });
    }

    // Update quantity
    await executeQuery(
      'UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?',
      [quantity, cartItemId]
    );

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating cart'
    });
  }
});

// Remove item from cart
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const cartItemId = parseInt(req.params.id);

    // Check if cart item belongs to user
    const cartItem = await getOne(
      'SELECT * FROM cart WHERE id = ? AND user_id = ?',
      [cartItemId, userId]
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Remove item
    await executeQuery('DELETE FROM cart WHERE id = ?', [cartItemId]);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing from cart'
    });
  }
});

// Clear entire cart
router.delete('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    await executeQuery('DELETE FROM cart WHERE user_id = ?', [userId]);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while clearing cart'
    });
  }
});

export default router;
