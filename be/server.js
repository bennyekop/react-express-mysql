// File: server.js

// Deskripsi: Ini adalah file utama untuk backend Node.js menggunakan Express.js.

//           Mengelola koneksi database, dan API CRUD untuk produk.

//           Autentikasi dihilangkan untuk rute produk (Proof of Concept).


// Mengimpor modul yang diperlukan

const express = require('express');

const mysql = require('mysql2/promise'); // Menggunakan mysql2 untuk fitur promise

const dotenv = require('dotenv');

const bcrypt = require('bcryptjs'); // Masih diperlukan jika rute /register atau /login dipertahankan

const jwt = require('jsonwebtoken'); // Masih diperlukan jika rute /login dipertahankan

const cors = require('cors'); // Untuk mengizinkan permintaan lintas asal dari frontend


// Menginisialisasi dotenv untuk memuat variabel lingkungan dari file .env

dotenv.config();


const app = express(); // Membuat instance aplikasi Express

const PORT = process.env.PORT || 8080; // Mengambil port dari .env atau default ke 5000


// Middleware untuk mengurai body permintaan dalam format JSON

app.use(express.json());


// --- Konfigurasi CORS (Wildcard untuk pengembangan/PoC) ---

app.use(cors({

    origin: '*', // Izinkan semua origin. UNTUK PRODUKSI, UBAH KE DOMAIN SPESIFIK ANDA.

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Izinkan metode HTTP ini

    allowedHeaders: ['Content-Type', 'Authorization'], // Izinkan header ini

    exposedHeaders: ['Content-Range', 'X-Content-Range'],

    credentials: true, // Mengizinkan pengiriman kredensial

    optionsSuccessStatus: 200

}));


// Tambahkan rute OPTIONS untuk CORS preflight (opsional, tapi bisa membantu)

app.options('*', cors());



// --- Konfigurasi Database MySQL ---

const dbConfig = {

    host: process.env.DB_HOST,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    port: process.env.DB_PORT || 3306 // Default MySQL port

};


let db; // Variabel untuk menyimpan koneksi database


// Fungsi untuk membuat koneksi ke database

const connectDB = async () => {

    try {

        db = await mysql.createConnection(dbConfig);

        console.log('Terhubung ke database MySQL!');


        // Membuat tabel 'users' jika belum ada (untuk autentikasi)

        // Tetap ada karena logic login/register masih dipertahankan (walaupun tidak digunakan frontend)

        await db.execute(`

            CREATE TABLE IF NOT EXISTS users (

                id INT AUTO_INCREMENT PRIMARY KEY,

                username VARCHAR(255) NOT NULL UNIQUE,

                password VARCHAR(255) NOT NULL

            )

        `);

        console.log('Tabel users siap.');


        // Membuat tabel 'products' jika belum ada (untuk data CRUD)

        await db.execute(`

            CREATE TABLE IF NOT EXISTS products (

                id INT AUTO_INCREMENT PRIMARY KEY,

                name VARCHAR(255) NOT NULL,

                description TEXT,

                price DECIMAL(10, 2) NOT NULL,

                stock INT NOT NULL

            )

        `);

        console.log('Tabel products siap.');


    } catch (err) {

        console.error('Gagal terhubung ke database:', err.message);

        process.exit(1);

    }

};


// Memanggil fungsi untuk menghubungkan ke database saat aplikasi dimulai

connectDB();


// --- Middleware Autentikasi JWT (DIJAGA, TAPI TIDAK DIGUNAKAN DI RUTE PRODUK) ---

// Fungsi ini tidak akan lagi dipanggil di rute produk, tapi tetap ada jika Anda ingin menggunakannya lagi

const authenticateToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];


    if (token == null) {

        return res.sendStatus(401);

    }


    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

        if (err) {

            console.error("Token verification error:", err.message);

            return res.sendStatus(403);

        }

        req.user = user;

        next();

    });

};


// --- Rute Autentikasi (DIJAGA, TAPI TIDAK DIGUNAKAN OLEH FRONTEND YANG BARU) ---


// Rute pendaftaran pengguna baru

app.post('/api/register', async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {

        return res.status(400).json({ message: 'Nama pengguna dan kata sandi diperlukan.' });

    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

        res.status(201).json({ message: 'Pengguna berhasil didaftarkan.' });

    } catch (err) {

        console.error('Error saat mendaftarkan pengguna:', err);

        if (err.code === 'ER_DUP_ENTRY') {

            return res.status(409).json({ message: 'Nama pengguna sudah ada.' });

        }

        res.status(500).json({ message: 'Kesalahan server.' });

    }

});


// Rute login pengguna

app.post('/api/login', async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {

        return res.status(400).json({ message: 'Nama pengguna dan kata sandi diperlukan.' });

    }

    try {

        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        const user = rows[0];

        if (!user) {

            return res.status(400).json({ message: 'Nama pengguna atau kata sandi salah.' });

        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {

            return res.status(400).json({ message: 'Nama pengguna atau kata sandi salah.' });

        }

        const accessToken = jwt.sign(

            { id: user.id, username: user.username },

            process.env.JWT_SECRET,

            { expiresIn: '1h' }

        );

        res.json({ message: 'Login berhasil!', accessToken: accessToken, username: user.username });

    } catch (err) {

        console.error('Error saat login:', err);

        res.status(500).json({ message: 'Kesalahan server.' });

    }

});



// --- Rute API CRUD Produk (TANPA AUTENTIKASI) ---


// Mendapatkan semua produk dengan pagination dan auto-search

app.get('/api/products', async (req, res) => { // authenticateToken DIHAPUS

    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 10;

    const search = req.query.search || '';

    const offset = (page - 1) * limit;


    try {

        let sqlCount = 'SELECT COUNT(*) AS total FROM products';

        let sqlQuery = 'SELECT * FROM products';

        let queryParams = [];

        let countParams = [];


        if (search) {

            sqlQuery += ' WHERE name LIKE ? OR description LIKE ?';

            sqlCount += ' WHERE name LIKE ? OR description LIKE ?';

            queryParams.push(`%${search}%`, `%${search}%`);

            countParams.push(`%${search}%`, `%${search}%`);

        }


        sqlQuery += ' LIMIT ? OFFSET ?';

        queryParams.push(limit, offset);


        const [totalRows] = await db.execute(sqlCount, countParams);

        const totalProducts = totalRows[0].total;


        const [products] = await db.execute(sqlQuery, queryParams);


        res.json({

            totalProducts,

            totalPages: Math.ceil(totalProducts / limit),

            currentPage: page,

            products

        });

    } catch (err) {

        console.error('Error saat mengambil produk:', err);

        res.status(500).json({ message: 'Kesalahan server saat mengambil produk.' });

    }

});


// Mendapatkan produk berdasarkan ID

app.get('/api/products/:id', async (req, res) => { // authenticateToken DIHAPUS

    const productId = req.params.id;

    try {

        const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [productId]);

        const product = rows[0];

        if (!product) {

            return res.status(404).json({ message: 'Produk tidak ditemukan.' });

        }

        res.json(product);

    } catch (err) {

        console.error('Error saat mengambil produk berdasarkan ID:', err);

        res.status(500).json({ message: 'Kesalahan server saat mengambil produk.' });

    }

});


// Menambahkan produk baru

app.post('/api/products', async (req, res) => { // authenticateToken DIHAPUS

    const { name, description, price, stock } = req.body;

    if (!name || !price || !stock) {

        return res.status(400).json({ message: 'Nama, harga, dan stok produk diperlukan.' });

    }

    if (isNaN(price) || isNaN(stock) || parseFloat(price) <= 0 || parseInt(stock) < 0) {

        return res.status(400).json({ message: 'Harga harus angka positif dan stok harus angka non-negatif.' });

    }

    try {

        const [result] = await db.execute(

            'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',

            [name, description, price, stock]

        );

        res.status(201).json({ message: 'Produk berhasil ditambahkan.', productId: result.insertId });

    } catch (err) {

        console.error('Error saat menambahkan produk:', err);

        res.status(500).json({ message: 'Kesalahan server saat menambahkan produk.' });

    }

});


// Memperbarui produk yang ada

app.put('/api/products/:id', async (req, res) => { // authenticateToken DIHAPUS

    const productId = req.params.id;

    const { name, description, price, stock } = req.body;

    if (!name || !price || !stock) {

        return res.status(400).json({ message: 'Nama, harga, dan stok produk diperlukan.' });

    }

    if (isNaN(price) || isNaN(stock) || parseFloat(price) <= 0 || parseInt(stock) < 0) {

        return res.status(400).json({ message: 'Harga harus angka positif dan stok harus angka non-negatif.' });

    }

    try {

        const [result] = await db.execute(

            'UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?',

            [name, description, price, stock, productId]

        );

        if (result.affectedRows === 0) {

            return res.status(404).json({ message: 'Produk tidak ditemukan.' });

        }

        res.json({ message: 'Produk berhasil diperbarui.' });

    } catch (err) {

        console.error('Error saat memperbarui produk:', err);

        res.status(500).json({ message: 'Kesalahan server saat memperbarui produk.' });

    }

});


// Menghapus produk

app.delete('/api/products/:id', async (req, res) => { // authenticateToken DIHAPUS

    const productId = req.params.id;

    try {

        const [result] = await db.execute('DELETE FROM products WHERE id = ?', [productId]);

        if (result.affectedRows === 0) {

            return res.status(404).json({ message: 'Produk tidak ditemukan.' });

        }

        res.json({ message: 'Produk berhasil dihapus.' });

    } catch (err) {

        console.error('Error saat menghapus produk:', err);

        res.status(500).json({ message: 'Kesalahan server saat menghapus produk.' });

    }

});


// --- Penanganan Error Global ---

app.use((err, req, res, next) => {

    console.error(err.stack);

    res.status(500).send('Terjadi kesalahan!');

});


// Memulai server Express

app.listen(PORT, () => {

    console.log(`Server berjalan di port ${PORT}`);

    console.log(`Buka http://localhost:${PORT}`);

});
