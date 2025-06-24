// File: src/App.js

// Deskripsi: Komponen utama React, menampilkan data produk langsung dari API tanpa autentikasi.

//            Semua UI dan logika login/register dihapus untuk Proof of Concept.

//            Termasuk perbaikan nomor urut tabel dan optimalisasi autosearch.


import React, { useState, useEffect, useCallback, useRef } from 'react';

import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useParams, Navigate } from 'react-router-dom';

import axios from 'axios';

import { Button, Navbar, Nav, Container, Modal, Form, Table, Pagination, FormControl, InputGroup } from 'react-bootstrap';

import 'bootstrap/dist/css/bootstrap.min.css';

import { debounce } from 'lodash';


// URL dasar API backend

const API_URL = 'https://isidomain-atau-IP-backend/api';


// --- Komponen Navbar (Disimplifikasi) ---

const AppNavbar = () => {

    return (

        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 rounded">

            <Container>

                <Navbar.Brand as={Link} to="/">Fullstack CRUD App (PoC)</Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">

                    <Nav className="me-auto">

                        <Nav.Link as={Link} to="/">Produk</Nav.Link> {/* Link ke halaman utama (produk) */}

                    </Nav>

                    <Nav>

                        <Navbar.Text className="text-muted">Mode Demo</Navbar.Text>

                    </Nav>

                </Navbar.Collapse>

            </Container>

        </Navbar>

    );

};


// --- Komponen Product List ---

const ProductList = () => {

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);

    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const [productIdToDelete, setProductIdToDelete] = useState(null);

    const [showErrorModal, setShowErrorModal] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();


    // Memoize fetchProducts function to make it stable

    const fetchProducts = useCallback(async (page = 1, search = '') => {

        setLoading(true);

        console.log(`Memulai pencarian untuk: "${search}" di halaman: ${page}`); // Log untuk debugging

        try {

            const res = await axios.get(`${API_URL}/products`, {

                params: { page, limit: 10, search }

            });

            setProducts(res.data.products);

            setCurrentPage(res.data.currentPage);

            setTotalPages(res.data.totalPages);

            console.log(`Pencarian berhasil. Ditemukan ${res.data.products.length} produk.`);

        } catch (err) {

            console.error('Error fetching products:', err);

            if (axios.isAxiosError(err)) {

                console.error('Axios error response:', err.response);

                console.error('Axios error request:', err.request);

                console.error('Axios error message:', err.message);

            } else {

                console.error('Non-Axios error:', err);

            }

            setErrorMessage(err.response?.data?.message || err.message || 'Gagal mengambil data produk.');

            setShowErrorModal(true);

        } finally {

            setLoading(false);

        }

    }, [setProducts, setCurrentPage, setTotalPages, setLoading, setErrorMessage, setShowErrorModal]);


    const debouncedFetchRef = useRef(

        debounce((page, search) => {

            console.log(`Fungsi debounced dipanggil dengan: "${search}"`); // Log saat debounce terpicu

            fetchProducts(page, search);

        }, 500) // Penundaan 500ms

    );


    useEffect(() => {

        const currentDebounce = debouncedFetchRef.current;

        if (currentDebounce) {

            currentDebounce.cancel(); // Batalkan setiap panggilan debounce yang tertunda

        }

        fetchProducts(currentPage, searchQuery); // Panggilan awal atau saat halaman berubah

        return () => {

            if (currentDebounce) {

                currentDebounce.cancel(); // Bersihkan saat komponen unmount atau dependensi berubah

            }

        };

    }, [currentPage, fetchProducts, searchQuery]);


    useEffect(() => {

        const currentDebounce = debouncedFetchRef.current;

        console.log(`searchQuery berubah menjadi: "${searchQuery}"`); // Log setiap kali input berubah

        if (searchQuery !== '') {

            currentDebounce(1, searchQuery); // Memicu fungsi debounced

        } else {

            currentDebounce.cancel(); // Batalkan debounce jika input kosong

            fetchProducts(1, ''); // Ambil data segera saat input pencarian dibersihkan

        }

        return () => {

            if (currentDebounce) {

                currentDebounce.cancel();

            }

        };

    }, [searchQuery, fetchProducts]);


    const handlePageChange = (page) => {

        if (page >= 1 && page <= totalPages) {

            setCurrentPage(page);

        }

    };


    const handleDeleteClick = (id) => {

        setProductIdToDelete(id);

        setShowConfirmationModal(true);

    };


    const confirmDelete = async () => {

        setShowConfirmationModal(false);

        try {

            await axios.delete(`${API_URL}/products/${productIdToDelete}`);

            fetchProducts(currentPage, searchQuery);

        } catch (err) {

            console.error('Error deleting product:', err);

            if (axios.isAxiosError(err)) {

                console.error('Axios error response:', err.response);

                console.error('Axios error request:', err.request);

                console.error('Axios error message:', err.message);

            }

            setErrorMessage(err.response?.data?.message || 'Gagal menghapus produk.');

            setShowErrorModal(true);

        } finally {

            setProductIdToDelete(null);

        }

    };


    if (loading) return <Container className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></Container>;


    return (

        <Container className="mt-4">

            <h2 className="text-center mb-4">Daftar Produk</h2>

            <div className="d-flex justify-content-between align-items-center mb-3">

                <Button variant="primary" onClick={() => navigate('/products/add')} className="rounded-pill">

                    Tambah Produk

                </Button>

                <InputGroup style={{ maxWidth: '300px' }}>

                    <FormControl

                        placeholder="Cari produk..."

                        value={searchQuery}

                        onChange={(e) => setSearchQuery(e.target.value)}

                        className="rounded-pill"

                    />

                </InputGroup>

            </div>

            {products.length === 0 ? (

                <p className="text-center">Tidak ada produk ditemukan.</p>

            ) : (

                <>

                    <Table striped bordered hover responsive className="rounded shadow-sm">

                        <thead className="bg-dark text-white">

                            <tr>

                                <th className="text-center">No.</th> {/* Label kolom untuk nomor urut */}

                                <th className="text-center">Nama</th>

                                <th className="text-center">Deskripsi</th>

                                <th className="text-center">Harga</th>

                                <th className="text-center">Stok</th>

                                <th className="text-center">Aksi</th>

                            </tr>

                        </thead>

                        <tbody>

                            {products.map((product, index) => ( // Menggunakan 'index' untuk nomor urut

                                <tr key={product.id}>

                                    {/* Menampilkan nomor urut yang disesuaikan dengan halaman */}

                                    <td className="text-center">{(currentPage - 1) * 10 + index + 1}</td>

                                    <td>{product.name}</td>

                                    <td>{product.description || '-'}</td>

                                    <td className="text-end">Rp {parseFloat(product.price).toLocaleString('id-ID')}</td>

                                    <td className="text-center">{product.stock}</td>

                                    <td className="text-center">

                                        <Button

                                            variant="warning"

                                            size="sm"

                                            onClick={() => navigate(`/products/edit/${product.id}`)}

                                            className="me-2 rounded-pill"

                                        >

                                            Edit

                                        </Button>

                                        <Button

                                            variant="danger"

                                            size="sm"

                                            onClick={() => handleDeleteClick(product.id)}

                                            className="rounded-pill"

                                        >

                                            Hapus

                                        </Button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </Table>


                    <Pagination className="justify-content-center mt-4">

                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />

                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />

                        {[...Array(totalPages)].map((_, index) => (

                            <Pagination.Item

                                key={index + 1}

                                active={index + 1 === currentPage}

                                onClick={() => handlePageChange(index + 1)}

                            >

                                {index + 1}

                            </Pagination.Item>

                        ))}

                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />

                        <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />

                    </Pagination>

                </>

            )}


            <ConfirmationModal

                show={showConfirmationModal}

                handleClose={() => setShowConfirmationModal(false)}

                handleConfirm={confirmDelete}

                message="Apakah Anda yakin ingin menghapus produk ini?"

            />

            <ErrorModal show={showErrorModal} handleClose={() => setShowErrorModal(false)} message={errorMessage} />

        </Container>

    );

};


// --- Komponen Product Form (Add/Edit) ---

const ProductForm = () => {

    const { id } = useParams();

    const navigate = useNavigate();

    const [name, setName] = useState('');

    const [description, setDescription] = useState('');

    const [price, setPrice] = useState('');

    const [stock, setStock] = useState('');

    const [loading, setLoading] = useState(false);

    const [showErrorModal, setShowErrorModal] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');


    useEffect(() => {

        if (id) {

            setLoading(true);

            const fetchProduct = async () => {

                try {

                    const res = await axios.get(`${API_URL}/products/${id}`);

                    const product = res.data;

                    setName(product.name);

                    setDescription(product.description);

                    setPrice(product.price);

                    setStock(product.stock);

                } catch (err) {

                    console.error('Error fetching product for edit:', err);

                    if (axios.isAxiosError(err)) {

                        console.error('Axios error response:', err.response);

                        console.error('Axios error request:', err.request);

                        console.error('Axios error message:', err.message);

                    }

                    setErrorMessage(err.response?.data?.message || 'Gagal mengambil detail produk.');

                    setShowErrorModal(true);

                    navigate('/');

                } finally {

                    setLoading(false);

                }

            };

            fetchProduct();

        }

    }, [id, navigate]);


    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);

        try {

            const productData = { name, description, price: parseFloat(price), stock: parseInt(stock) };

            if (id) {

                await axios.put(`${API_URL}/products/${id}`, productData);

            } else {

                await axios.post(`${API_URL}/products`, productData);

            }

            navigate('/');

        } catch (err) {

            console.error('Error saving product:', err);

            if (axios.isAxiosError(err)) {

                console.error('Axios error response:', err.response);

                console.error('Axios error request:', err.request);

                console.error('Axios error message:', err.message);

            }

            setErrorMessage(err.response?.data?.message || 'Gagal menyimpan produk. Periksa input Anda.');

            setShowErrorModal(true);

        } finally {

            setLoading(false);

        }

    };


    if (loading && id) return <Container className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></Container>;


    return (

        <Container className="mt-4">

            <h2 className="text-center mb-4">{id ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>

            <Form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-light mx-auto" style={{ maxWidth: '600px' }}>

                <Form.Group className="mb-3" controlId="formProductName">

                    <Form.Label>Nama Produk</Form.Label>

                    <Form.Control

                        type="text"

                        placeholder="Masukkan nama produk"

                        value={name}

                        onChange={(e) => setName(e.target.value)}

                        required

                        className="rounded"

                    />

                </Form.Group>


                <Form.Group className="mb-3" controlId="formProductDescription">

                    <Form.Label>Deskripsi</Form.Label>

                    <Form.Control

                        as="textarea"

                        rows={3}

                        placeholder="Masukkan deskripsi produk"

                        value={description}

                        onChange={(e) => setDescription(e.target.value)}

                        className="rounded"

                    />

                </Form.Group>


                <Form.Group className="mb-3" controlId="formProductPrice">

                    <Form.Label>Harga</Form.Label>

                    <InputGroup>

                        <InputGroup.Text>Rp</InputGroup.Text>

                        <Form.Control

                            type="number"

                            placeholder="Masukkan harga"

                            value={price}

                            onChange={(e) => setPrice(e.target.value)}

                            required

                            min="0.01"

                            step="0.01"

                            className="rounded-end"

                        />

                    </InputGroup>

                </Form.Group>


                <Form.Group className="mb-3" controlId="formProductStock">

                    <Form.Label>Stok</Form.Label>

                    <Form.Control

                        type="number"

                        placeholder="Masukkan jumlah stok"

                        value={stock}

                        onChange={(e) => setStock(e.target.value)}

                        required

                        min="0"

                        className="rounded"

                    />

                </Form.Group>


                <Button variant="primary" type="submit" disabled={loading} className="w-100 rounded-pill mt-3">

                    {loading ? 'Menyimpan...' : (id ? 'Perbarui Produk' : 'Tambah Produk')}

                </Button>

                <Button variant="secondary" onClick={() => navigate('/')} className="w-100 rounded-pill mt-2">

                    Batal

                </Button>

            </Form>

            <ErrorModal show={showErrorModal} handleClose={() => setShowErrorModal(false)} message={errorMessage} />

        </Container>

    );

};


// --- Komponen Modal Konfirmasi Umum ---

const ConfirmationModal = ({ show, handleClose, handleConfirm, message }) => {

    return (

        <Modal show={show} onHide={handleClose} centered>

            <Modal.Header closeButton>

                <Modal.Title>Konfirmasi</Modal.Title>

            </Modal.Header>

            <Modal.Body>{message}</Modal.Body>

            <Modal.Footer>

                <Button variant="secondary" onClick={handleClose} className="rounded-pill">

                    Batal

                </Button>

                <Button variant="primary" onClick={handleConfirm} className="rounded-pill">

                    Konfirmasi

                </Button>

            </Modal.Footer>

        </Modal>

    );

};


// --- Komponen Modal Error Umum ---

const ErrorModal = ({ show, handleClose, message }) => {

    return (

        <Modal show={show} onHide={handleClose} centered>

            <Modal.Header closeButton>

                <Modal.Title className="text-danger">Error!</Modal.Title>

            </Modal.Header>

            <Modal.Body className="text-danger">{message}</Modal.Body>

            <Modal.Footer>

                <Button variant="danger" onClick={handleClose} className="rounded-pill">

                    Tutup

                </Button>

            </Modal.Footer>

        </Modal>

    );

};


// --- Komponen Modal Sukses Umum ---

const SuccessModal = ({ show, handleClose, message }) => {

    return (

        <Modal show={show} onHide={handleClose} centered>

            <Modal.Header closeButton>

                <Modal.Title className="text-success">Sukses!</Modal.Title>

            </Modal.Header>

            <Modal.Body className="text-success">{message}</Modal.Body>

            <Modal.Footer>

                <Button variant="success" onClick={handleClose} className="rounded-pill">

                    OK

                </Button>

            </Modal.Footer>

        </Modal>

    );

};


// --- Halaman 404 (Not Found) ---

const NotFound = () => {

    return (

        <Container className="text-center mt-5">

            <h1 className="display-1">404</h1>

            <p className="lead">Halaman Tidak Ditemukan</p>

            <Link to="/" className="btn btn-primary rounded-pill">Kembali ke Beranda</Link>

        </Container>

    );

};


// --- Komponen Aplikasi Utama ---

function App() {

    return (

        <Router>

            <AppNavbar />

            <Routes>

                <Route path="/" element={<ProductList />} />

                <Route path="/products/add" element={<ProductForm />} />

                <Route path="/products/edit/:id" element={<ProductForm />} />

                <Route path="*" element={<NotFound />} />

            </Routes>

        </Router>

    );

}


export default App;
