// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDdz-E2NiUOVwFnpZ_PbOdOSg_5LPgx9p8",
    authDomain: "antrianapp-b2b75.firebaseapp.com",
    databaseURL: "https://antrianapp-b2b75-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "antrianapp-b2b75",
    storageBucket: "antrianapp-b2b75.appspot.com",
    messagingSenderId: "851190128972",
    appId: "1:851190128972:web:02424c256958b90d92efe9",
    measurementId: "G-E9YVPR644B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variable untuk melacak apakah form sudah di-render
let formRendered = false;

// Fungsi untuk merender form hanya sekali
function renderForm() {
    if (formRendered) return; // Jangan render ulang jika sudah ada

    const orderFormContainer = document.getElementById('orderFormContainer');
    if (!orderFormContainer) {
        console.error('Element orderFormContainer tidak ditemukan');
        return;
    }

    orderFormContainer.innerHTML = `
            <h2 class="text-center mb-4">FORM PREORDER (Harap Baca S&K dibawah form)</h2>
            <form id="antrianForm">
                <div class="mb-3">
                    <label for="nama" class="form-label">Nama Lengkap</label>
                    <input type="text" class="form-control" id="nama" required 
                           style="background: rgba(40, 40, 60, 0.7); color: white; border: 1px solid #6a11cb;">
                </div>
                <div class="mb-3">
                    <label for="nomor" class="form-label">Nomor HP</label>
                    <input type="tel" class="form-control" id="nomor" required
                           style="background: rgba(40, 40, 60, 0.7); color: white; border: 1px solid #6a11cb;">
                </div>
                <div class="mb-3">
                    <label for="versi" class="form-label">Versi Produk</label>
                    <select class="form-select" id="versi" required
                            style="background: rgba(40, 40, 60, 0.7); color: white; border: 1px solid #6a11cb;">
                        <option value="">Pilih Versi</option>
                        <option value="Dasai Reguler">Dasai Reguler</option>
                        <option value="Liberty Walk">Liberty Walk</option>
                        <option value="GTR">GTR</option>
                        <option value="ESP32 Navigasi">ESP32 Navigasi</option>
                        <option value="Dasai Sound Mochi+Custom Animasi">Dasai Sound+Custom animasi</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="warna" class="form-label">Warna (kosongkan warna untuk ESP32 NavMaps)</label>
                    <input type="text" class="form-control" id="warna"
                           style="background: rgba(40, 40, 60, 0.7); color: white; border: 1px solid #6a11cb;">
                </div>
                <button type="submit" class="btn btn-primary w-100 mt-4"
                        style="background: linear-gradient(to right, #6a11cb, #2575fc); border: none;">
                    Daftar Preorder
                </button>
            </form>
        `;

    // Tambahkan event listener untuk form submission
    const antrianForm = document.getElementById('antrianForm');
    if (antrianForm) {
        antrianForm.addEventListener('submit', handleFormSubmit);
        formRendered = true;
    }
}

// Fungsi untuk menangani form submission
function handleFormSubmit(e) {
    e.preventDefault(); // Mencegah form submit default

    // Ambil data dari form
    const nama = document.getElementById('nama').value.trim();
    const nomor = document.getElementById('nomor').value.trim();
    const versi = document.getElementById('versi').value;
    const warna = document.getElementById('warna').value.trim();

    // Validasi data
    if (!nama || !nomor || !versi) {
        alert('Mohon lengkapi semua field yang required!');
        return;
    }

    // Validasi nomor HP (harus dimulai dengan angka dan minimal 10 digit)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(nomor.replace(/\D/g, ''))) {
        alert('Mohon masukkan nomor HP yang valid (10-15 digit)!');
        return;
    }

    // Validasi warna untuk versi selain ESP32 Navigasi
    if (versi !== 'ESP32 Navigasi' && !warna) {
        alert('Mohon isi warna untuk produk yang dipilih!');
        return;
    }

    // Tampilkan loading state
    const submitButton = document.querySelector('#antrianForm button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Memproses...';
    submitButton.disabled = true;

    // Data yang akan disimpan
    const orderData = {
        nama: nama,
        nomor: nomor,
        versi: versi,
        warna: warna || 'N/A', // Jika kosong, isi dengan N/A
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    // Simpan ke Firebase Database
    const ordersRef = database.ref('orders');
    ordersRef.push(orderData)
        .then((snapshot) => {
            console.log('Order berhasil disimpan dengan ID:', snapshot.key);

            // Format pesan WhatsApp
            const waMessage = `*PREORDER BARU*%0A%0A` +
                `Nama: ${encodeURIComponent(nama)}%0A` +
                `Nomor HP: ${encodeURIComponent(nomor)}%0A` +
                `Versi Produk: ${encodeURIComponent(versi)}%0A` +
                `Warna: ${encodeURIComponent(warna || 'N/A')}%0A` +
                `Waktu Order: ${encodeURIComponent(new Date().toLocaleString('id-ID'))}%0A%0A` +
                `Silakan konfirmasi pembayaran DP minimal Rp 80.000 ke rekening BCA 4561449095 / DANA 089515441332 yang telah disediakan.%0A` +
                `Status: *Pending*%0A%0A` +
                `Terima kasih telah melakukan preorder!`;

            // URL WhatsApp
            const waURL = `https://wa.me/6289515441332?text=${waMessage}`;

            // Reset form
            document.getElementById('antrianForm').reset();

            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;

            // Tampilkan pesan sukses
            alert('Preorder berhasil didaftarkan! Anda akan diarahkan ke WhatsApp untuk konfirmasi.');

            // Redirect ke WhatsApp
            window.open(waURL, '_blank');

        })
        .catch((error) => {
            console.error('Error menyimpan order:', error);
            alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');

            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        });
}

// Fungsi untuk mengupdate countdown
function updateCountdown() {
    const poRef = database.ref('antrian');
    poRef.once('value').then((snapshot) => {
        const data = snapshot.val();
        const countdownEl = document.getElementById('poCountdown');
        const countdownContainer = document.getElementById('countdownContainer');
        const orderFormContainer = document.getElementById('orderFormContainer');

        // Cek apakah element ada
        if (!countdownEl || !countdownContainer || !orderFormContainer) {
            console.error('Element countdown atau form container tidak ditemukan');
            return;
        }

        if (!data || !data.poDatetime) {
            countdownEl.innerHTML = 'Informasi PO belum tersedia';
            countdownContainer.style.display = 'block';
            orderFormContainer.style.display = 'none';
            return;
        }

        const poDatetime = new Date(data.poDatetime);
        const now = new Date();

        // Validasi tanggal
        if (isNaN(poDatetime.getTime())) {
            countdownEl.innerHTML = 'Format tanggal PO tidak valid';
            countdownContainer.style.display = 'block';
            orderFormContainer.style.display = 'none';
            return;
        }

        if (poDatetime > now) {
            // Jika PO belum tersedia, tampilkan countdown
            const diffMs = poDatetime - now;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
            const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
            const diffSeconds = Math.floor((diffMs / 1000) % 60);

            countdownEl.innerHTML = `PO akan dibuka dalam ${diffDays} hari ${diffHours} jam ${diffMinutes} menit ${diffSeconds} detik`;

            // Sembunyikan form dan tampilkan countdown
            countdownContainer.style.display = 'block';
            orderFormContainer.style.display = 'none';
            formRendered = false; // Reset flag jika countdown aktif
        } else {
            // Jika PO sudah tersedia, tampilkan form
            countdownContainer.style.display = 'none';
            orderFormContainer.style.display = 'block';

            // Render form hanya jika belum di-render
            renderForm();
        }
    }).catch((error) => {
        console.error('Gagal mengambil data countdown:', error);
        const countdownEl = document.getElementById('poCountdown');
        if (countdownEl) {
            countdownEl.innerHTML = 'Error memuat informasi PO';
        }
    });
}

// Jalankan fungsi pertama kali ketika DOM sudah siap
document.addEventListener('DOMContentLoaded', function () {
    updateCountdown();
    // Set interval untuk update setiap detik
    setInterval(updateCountdown, 1000);
});
document.addEventListener('DOMContentLoaded', function () {
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Color selection (untuk form lain jika ada)
    const colorOptions = document.querySelectorAll('.color-option');
    const colorInput = document.getElementById('selectedColor');

    if (colorOptions.length > 0 && colorInput) {
        colorOptions.forEach(option => {
            option.addEventListener('click', function () {
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                colorInput.value = this.dataset.color;
            });
        });
    }

    // Form submission untuk form lain (orderForm)
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const agreeTerms = document.getElementById('agreeTerms');
            if (agreeTerms && !agreeTerms.checked) {
                alert('Anda harus menyetujui Syarat & Ketentuan dan bersedia melakukan DP minimal Rp 50.000');
                return;
            }

            const name = document.getElementById('name')?.value || '';
            const phone = document.getElementById('phone')?.value || '';
            const product = document.getElementById('product')?.value || '';
            const color = document.getElementById('selectedColor')?.value || '';
            const address = document.getElementById('address')?.value || '';
            const notes = document.getElementById('notes')?.value || '';

            if (!name || !phone || !product || !color || !address) {
                alert('Mohon lengkapi semua field yang required!');
                return;
            }

            let message = `*[PRE-ORDER]*\n\n`;
            message += `Nama: ${name}\n`;
            message += `No. HP: ${phone}\n`;
            message += `Produk: ${product}\n`;
            message += `Warna: ${color.charAt(0).toUpperCase() + color.slice(1)}\n`;
            message += `Alamat: ${address}\n\n`;
            message += `*Saya bersedia melakukan DP minimal Rp 50.000*\n\n`;
            if (notes) {
                message += `Catatan: ${notes}\n\n`;
            }
            message += `_Mohon konfirmasi ketersediaan stock dan total pembayaran_`;

            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/6289515441332?text=${encodedMessage}`, '_blank');
        });
    }

    // Back to Top Button
    const backToTopButton = document.getElementById('backToTop');
    if (backToTopButton) {
        // Hide button initially
        backToTopButton.style.display = 'none';

        window.addEventListener('scroll', function () {
            if (window.pageYOffset > 300) {
                backToTopButton.style.display = 'flex';
            } else {
                backToTopButton.style.display = 'none';
            }
        });

        backToTopButton.addEventListener('click', function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Initialize Particle.js
    const particlesContainer = document.getElementById('particles-js');
    if (particlesContainer && typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#6a11cb"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 5
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#6a11cb",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    }
});