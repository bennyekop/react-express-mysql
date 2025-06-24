// File: src/index.js

// Deskripsi: Titik masuk utama untuk aplikasi React.

//           Bertanggung jawab untuk me-render komponen App ke DOM.


import React from 'react';

import ReactDOM from 'react-dom/client'; // Menggunakan createRoot dari 'react-dom/client'

import './index.css'; // Pastikan file ini ada di src/

import App from './App'; // Mengimpor komponen App dari App.js

import reportWebVitals from './reportWebVitals'; // Pastikan file ini ada di src/ dan mengekspor default


// Membuat root React untuk aplikasi Anda.

// Ini adalah cara modern untuk me-render aplikasi React.

const root = ReactDOM.createRoot(document.getElementById('root'));


// Me-render komponen App ke dalam elemen 'root' di public/index.html

root.render(

  <React.StrictMode>

    <App /> {/* Ini adalah komponen utama yang Anda buat */}

  </React.StrictMode>

);


// Panggil reportWebVitals hanya jika fungsi tersebut sudah berhasil diimpor

// Ini adalah safety check tambahan.

if (typeof reportWebVitals === 'function') {

  reportWebVitals();

} else {

  console.warn("reportWebVitals function is not available.");

}
