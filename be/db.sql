-- SQL Script untuk membuat tabel 'users' dan 'products'

-- Digunakan oleh aplikasi fullstack Node.js (Express) dan React.js


-- Hapus tabel 'products' jika sudah ada, untuk memulai dari awal (opsional, hati-hati dengan data)

DROP TABLE IF EXISTS products;


-- Hapus tabel 'users' jika sudah ada, untuk memulai dari awal (opsional, hati-hati dengan data)

DROP TABLE IF EXISTS users;


-- Membuat tabel 'users' untuk menyimpan informasi pengguna (login)

-- 'id' adalah primary key yang auto-increment

-- 'username' harus unik untuk setiap pengguna

-- 'password' akan menyimpan hash dari kata sandi

CREATE TABLE users (

    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(255) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL

);


-- Membuat tabel 'products' untuk menyimpan data produk (CRUD)

-- 'id' adalah primary key yang auto-increment

-- 'name' adalah nama produk (tidak boleh kosong)

-- 'description' adalah deskripsi produk

-- 'price' adalah harga produk (DECIMAL untuk presisi keuangan, tidak boleh kosong, harus positif)

-- 'stock' adalah jumlah stok produk (tidak boleh kosong, harus non-negatif)

CREATE TABLE products (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    price DECIMAL(10, 2) NOT NULL,

    stock INT NOT NULL

);


-- Contoh data (opsional, bisa Anda import setelah tabel dibuat)

-- Anda bisa menambahkan beberapa pengguna atau produk awal di sini


-- Contoh pengguna: (Password 'password123' di-hash dengan bcrypt, jadi ini hanya contoh placeholder)

-- Anda harus mendaftarkan pengguna melalui API /api/register agar password ter-hash dengan benar

-- INSERT INTO users (username, password) VALUES ('admin', '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');


-- Contoh produk:

INSERT INTO products (name, description, price, stock) VALUES

('Laptop Gaming', 'Laptop berperforma tinggi untuk gaming', 15000000.00, 10),

('Smartphone Terbaru', 'Smartphone dengan kamera canggih', 8500000.00, 25),

('Mouse Nirkabel', 'Mouse ergonomis untuk penggunaan sehari-hari', 250000.00, 100),

('Keyboard Mekanikal', 'Keyboard dengan switch taktil dan lampu RGB', 900000.00, 50),

('Monitor Ultrawide', 'Monitor 34 inci dengan resolusi tinggi', 6000000.00, 15);
