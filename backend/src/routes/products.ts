import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { executeQuery, getOne } from '../config/database';
import { Product, ProductCreate, ApiResponse } from '../types';

const router = express.Router();

// Get all products with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = '20', offset = '0' } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    // Add category filter
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    // Add search filter
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add ordering and pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const products = await executeQuery(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const countParams: any[] = [];

    if (category && category !== 'all') {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + parseInt(limit as string) < total
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching products'
    });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await getOne('SELECT * FROM products WHERE id = ?', [parseInt(id)]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching product'
    });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    const products = await executeQuery(
      'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [category, parseInt(limit as string), parseInt(offset as string)]
    );

    const countResult = await executeQuery(
      'SELECT COUNT(*) as total FROM products WHERE category = ?',
      [category]
    );
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      message: `Products in ${category} category retrieved successfully`,
      data: {
        products,
        category,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + parseInt(limit as string) < total
        }
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching products by category'
    });
  }
});

// Get all categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await executeQuery(
      'SELECT DISTINCT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category'
    );

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching categories'
    });
  }
});

// Admin route: Create new product (would require admin authentication in production)
const createProductValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2-100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10-500 characters'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
  body('category').trim().isLength({ min: 2, max: 50 }).withMessage('Category must be between 2-50 characters'),
  body('image').isURL().withMessage('Image must be a valid URL'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
];

router.post('/', createProductValidation, async (req, res) => {
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

    const { name, description, price, category, image, stock }: ProductCreate = req.body;

    // Insert new product
    const result = await executeQuery(
      'INSERT INTO products (name, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, category, image, stock]
    );

    // Get the created product
    const newProduct = await getOne('SELECT * FROM products WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: newProduct }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating product'
    });
  }
});

export default router;
