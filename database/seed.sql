-- VastraVerse Sample Data
-- Seed data for Indian clothing products

USE vastraverse;

-- Insert sample products with Indian clothing items
INSERT INTO products (name, description, price, category, image, stock) VALUES
-- Men's Traditional Wear
('Classic Kurta Set', 'Elegant cotton kurta with matching pajama. Perfect for festivals and traditional occasions. Comfortable fit with intricate embroidery.', 1299.00, 'Men', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500', 25),
('Royal Sherwani', 'Premium silk sherwani with golden work. Ideal for weddings and special ceremonies. Includes matching churidar.', 4999.00, 'Men', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=500', 15),
('Casual Cotton Shirt', 'Modern casual shirt with Indian prints. Breathable cotton fabric perfect for daily wear.', 899.00, 'Men', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500', 40),

-- Women's Traditional Wear
('Banarasi Silk Saree', 'Handwoven Banarasi silk saree with golden zari work. Traditional elegance for special occasions.', 3499.00, 'Women', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500', 20),
('Designer Lehenga Choli', 'Beautiful lehenga choli with mirror work and embroidery. Perfect for weddings and festivals.', 5999.00, 'Women', 'https://images.unsplash.com/photo-1583391733981-24c8d6d6e4b6?w=500', 12),
('Cotton Anarkali Suit', 'Comfortable cotton anarkali with dupatta. Elegant design suitable for both casual and formal wear.', 1899.00, 'Women', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=500', 30),
('Printed Kurti', 'Trendy printed kurti with contemporary design. Perfect for office wear and casual outings.', 799.00, 'Women', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500', 50),

-- Kids Wear
('Kids Dhoti Kurta Set', 'Adorable dhoti kurta set for boys. Comfortable cotton fabric with traditional styling.', 699.00, 'Kids', 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=500', 35),
('Girls Lehenga Set', 'Cute lehenga choli for girls with colorful embroidery. Perfect for festivals and parties.', 999.00, 'Kids', 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500', 28),
('Kids Casual Wear Set', 'Modern casual wear set with Indian touch. Comfortable for daily wear and play.', 599.00, 'Kids', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500', 45),

-- Traditional Accessories
('Embroidered Dupatta', 'Beautiful embroidered dupatta with golden border. Complements any traditional outfit.', 499.00, 'Traditional', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500', 60),
('Traditional Mojari', 'Handcrafted leather mojari with traditional designs. Comfortable and stylish footwear.', 899.00, 'Traditional', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500', 40);

-- Insert a sample admin user (password: admin123)
-- Note: In production, this should be created through proper registration
INSERT INTO users (name, email, password, phone, address) VALUES
('Admin User', 'admin@vastraverse.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Vq/sFm', '+91-9876543210', 'VastraVerse HQ, Mumbai, India');

-- Note: The password hash above is for 'admin123' - in production, use proper password hashing
