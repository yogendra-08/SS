import express from 'express';
import { body, validationResult } from 'express-validator';
import { executeQuery, getOne } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get user's wishlist items
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    const wishlistItems = await executeQuery(`
      SELECT 
        w.id, w.user_id, w.product_id, w.created_at,
        p.name, p.description, p.price, p.category, p.image, p.stock
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [userId]);

    res.status(200).json({
      success: true,
      message: 'Wishlist items retrieved successfully',
      data: {
        items: wishlistItems,
        count: wishlistItems.length
      }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching wishlist'
    });
  }
});

// Add item to wishlist
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { product_id } = req.body;

    if (!product_id || isNaN(parseInt(product_id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required'
      });
    }

    // Check if product exists
    const product = await getOne('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if item already exists in wishlist
    const existingItem = await getOne(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Item already exists in wishlist'
      });
    }

    // Add to wishlist
    await executeQuery(
      'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [userId, product_id]
    );

    res.status(201).json({
      success: true,
      message: 'Item added to wishlist successfully'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding to wishlist'
    });
  }
});

// Remove item from wishlist
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const wishlistItemId = parseInt(req.params.id);

    // Check if wishlist item belongs to user
    const wishlistItem = await getOne(
      'SELECT id FROM wishlist WHERE id = ? AND user_id = ?',
      [wishlistItemId, userId]
    );

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist item not found'
      });
    }

    // Remove item
    await executeQuery('DELETE FROM wishlist WHERE id = ?', [wishlistItemId]);

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing from wishlist'
    });
  }
});

// Remove item from wishlist by product_id
router.delete('/product/:productId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const productId = parseInt(req.params.productId);

    // Remove item
    const result = await executeQuery(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Remove from wishlist by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing from wishlist'
    });
  }
});

export default router;
