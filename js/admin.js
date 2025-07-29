// Konfigurasi Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyDdz-E2NiUOVwFnpZ_PbOdOSg_5LPgx9p8",
            authDomain: "antrianapp-b2b75.firebaseapp.com",
            databaseURL: "https://antrianapp-b2b75-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "antrianapp-b2b75",
            storageBucket: "antrianapp-b2b75.firebasestorage.app",
            messagingSenderId: "851190128972",
            appId: "1:851190128972:web:02424c256958b90d92efe9",
            measurementId: "G-E9YVPR644B"
        };

        // Inisialisasi Firebase
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.database();

        // Fungsi untuk menampilkan notifikasi
        function showNotification(message, type = 'success', duration = 5000) {
            const notification = document.getElementById('notification');
            const messageSpan = document.getElementById('notificationMessage');

            // Set icon based on type
            let iconClass;
            switch (type) {
                case 'error':
                    iconClass = 'fas fa-exclamation-circle';
                    break;
                case 'warning':
                    iconClass = 'fas fa-exclamation-triangle';
                    break;
                default:
                    iconClass = 'fas fa-check-circle';
            }

            notification.innerHTML = `<i class="${iconClass}"></i><span id="notificationMessage">${message}</span>`;
            notification.className = `notification ${type} show`;

            // Auto hide
            setTimeout(() => {
                notification.classList.remove('show');
            }, duration);
        }

        // Fungsi untuk mendapatkan status indicator
        function getStatusIndicator(status) {
            const statusClass = `status-${status.replace(/\s+/g, '-')}`;
            return `<span class="status-indicator ${statusClass}"></span>`;
        }

        // Fungsi untuk menambah antrian baru
        function addQueueRow(queueItem = { name: '', number: '', status: 'belum diproses', version: 'Dasai Reguler', color: '' }) {
            const rowId = 'item-' + Date.now();
            const queueRow = document.createElement('div');
            queueRow.className = 'queue-item fade-in';
            queueRow.dataset.id = rowId;

            queueRow.innerHTML = `
                <button class="delete-btn" data-id="${rowId}" title="Hapus antrian">
                    <i class="fas fa-times"></i>
                </button>
                <div class="form-group">
                    <label>Nama Pelanggan</label>
                    <input type="text" class="form-control" placeholder="Nama lengkap" value="${queueItem.name}" required>
                </div>
                <div class="form-group">
                    <label>Nomor Antrian</label>
                    <input type="number" class="form-control" placeholder="Nomor antrian" value="${queueItem.number}" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select class="form-control" required>
                        <option value="belum diproses" ${queueItem.status === 'belum diproses' ? 'selected' : ''}>
                            ${getStatusIndicator('belum diproses')} Belum Diproses
                        </option>
                        <option value="bahan sedang dipesan" ${queueItem.status === 'bahan sedang dipesan' ? 'selected' : ''}>
                            ${getStatusIndicator('bahan sedang dipesan')} Bahan Sedang Dipesan
                        </option>
                        <option value="proses" ${queueItem.status === 'proses' ? 'selected' : ''}>
                            ${getStatusIndicator('proses')} Proses
                        </option>
                        <option value="sedang dikirim" ${queueItem.status === 'sedang dikirim' ? 'selected' : ''}>
                            ${getStatusIndicator('sedang dikirim')} Sedang Dikirim
                        </option>
                        <option value="selesai" ${queueItem.status === 'selesai' ? 'selected' : ''}>
                            ${getStatusIndicator('selesai')} Selesai
                        </option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Versi</label>
                    <select class="form-control" required>
                        <option value="Dasai Reguler" ${queueItem.version === 'Dasai Reguler' ? 'selected' : ''}>Dasai Reguler</option>
                        <option value="Liberty Walk" ${queueItem.version === 'Liberty Walk' ? 'selected' : ''}>Liberty Walk</option>
                        <option value="GTR" ${queueItem.version === 'GTR' ? 'selected' : ''}>GTR</option>
                        <option value="ESP32 Navigasi" ${queueItem.version === 'ESP32 Navigasi' ? 'selected' : ''}>ESP32 Navigasi</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Warna</label>
                    <input type="text" class="form-control" placeholder="Warna kendaraan (kosongkan untuk ESP32 Navigasi)" value="${queueItem.color}">
                </div>
            `;

            document.getElementById('antrianInputs').appendChild(queueRow);
            return queueRow;
        }

        // Fungsi untuk posting pengumuman dengan Push ID otomatis
        function postAnnouncement() {
            const title = document.getElementById('announcementTitle').value.trim();
            const message = document.getElementById('announcementMessage').value.trim();

            if (!title || !message) {
                showNotification('Judul dan isi pengumuman harus diisi!', 'error');
                return;
            }

            // Generate Push ID otomatis
            const newAnnouncementRef = db.ref('announcements').push();

            newAnnouncementRef.set({
                title: title,
                message: message,
                timestamp: new Date().toISOString(),
                author: 'Admin'
            }).then(() => {
                showNotification('Pengumuman berhasil diposting!', 'success');
                document.getElementById('announcementTitle').value = '';
                document.getElementById('announcementMessage').value = '';
            }).catch((error) => {
                console.error("Error posting announcement:", error);
                showNotification('Gagal memposting pengumuman: ' + error.message, 'error');
            });
        }

        // Fungsi untuk menyimpan data ke Firebase
        async function saveQueueData() {
            const saveBtn = document.getElementById('saveBtn');
            const originalText = saveBtn.innerHTML;

            try {
                // Disable button dan show loading
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

                const poDatetime = document.getElementById('poDatetime').value;
                if (!poDatetime) {
                    throw new Error('Harap isi tanggal dan waktu PO');
                }

                const queueItems = document.querySelectorAll('.queue-item');
                if (queueItems.length === 0) {
                    throw new Error('Tambahkan setidaknya satu antrian');
                }

                const queueData = [];
                let isValid = true;
                let invalidFields = [];

                queueItems.forEach((item, index) => {
                    const inputs = item.querySelectorAll('input, select');
                    const itemData = {};

                    inputs.forEach(input => {
                        const fieldName = input.previousElementSibling.textContent.toLowerCase().replace(/\s+/g, '');
                        const value = input.value.trim();

                        // Validasi khusus untuk warna (tidak required untuk ESP32 Navigasi)
                        if (fieldName === 'warna') {
                            const versionSelect = item.querySelector('select:nth-of-type(2)');
                            const version = versionSelect ? versionSelect.value : '';

                            if (version !== 'ESP32 Navigasi' && !value) {
                                input.style.border = '2px solid var(--danger)';
                                invalidFields.push(`Antrian ${index + 1}: Warna harus diisi untuk versi ${version}`);
                                isValid = false;
                            } else {
                                input.style.border = '1px solid var(--gray-dark)';
                                itemData[fieldName] = value || 'N/A';
                            }
                        } else if (!value && input.hasAttribute('required')) {
                            input.style.border = '2px solid var(--danger)';
                            invalidFields.push(`Antrian ${index + 1}: ${input.previousElementSibling.textContent} harus diisi`);
                            isValid = false;
                        } else {
                            input.style.border = '1px solid var(--gray-dark)';
                            itemData[fieldName] = value;
                        }
                    });

                    if (Object.keys(itemData).length > 0) {
                        queueData.push({
                            name: itemData.namapelanggan || '',
                            number: parseInt(itemData.nomorantrian) || 0,
                            status: itemData.status || 'belum diproses',
                            version: itemData.versi || 'Dasai Reguler',
                            color: itemData.warna || 'N/A'
                        });
                    }
                });

                if (!isValid) {
                    throw new Error(`Validasi gagal:\n${invalidFields.join('\n')}`);
                }

                // Simpan ke Firebase dengan struktur yang benar
                await db.ref('antrian').set({
                    poDatetime,
                    queue: queueData,
                    lastUpdated: new Date().toISOString()
                });

                showNotification(
                    `Data berhasil disimpan! (${queueData.length} antrian)`,
                    'success'
                );

            } catch (error) {
                console.error("Error saving data:", error);
                showNotification('❌ ' + error.message, 'error');
            } finally {
                // Reset button state
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Semua';
            }
        }

        // Fungsi untuk memuat data dari Firebase
        async function loadQueueData() {
            try {
                const snapshot = await db.ref('antrian').once('value');

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    document.getElementById('poDatetime').value = data.poDatetime || new Date().toISOString().slice(0, 16);

                    if (data.queue && data.queue.length > 0) {
                        document.getElementById('antrianInputs').innerHTML = '';
                        data.queue.forEach(item => addQueueRow(item));
                    }
                }
            } catch (error) {
                console.error("Error loading data:", error);
                showNotification('Gagal memuat data: ' + error.message, 'error');
            }
        }

        // Fungsi untuk menghapus semua data
        async function deleteAllData() {
            if (confirm('⚠️ Apakah Anda yakin ingin menghapus SEMUA data antrian?\n\nTindakan ini tidak dapat dibatalkan!')) {
                const deleteBtn = document.getElementById('deleteAllBtn');
                const originalText = deleteBtn.innerHTML;

                try {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';

                    await db.ref('antrian').remove();
                    document.getElementById('antrianInputs').innerHTML = '';
                    document.getElementById('poDatetime').value = new Date().toISOString().slice(0, 16);

                    showNotification('Semua data berhasil dihapus', 'success');
                } catch (error) {
                    console.error("Error deleting data:", error);
                    showNotification('Gagal menghapus data: ' + error.message, 'error');
                } finally {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Hapus Semua Data';
                }
            }
        }

        // Fungsi untuk menampilkan daftar pengumuman di admin
        function loadAdminAnnouncements() {
            const list = document.getElementById('adminAnnouncementList');
            if (!list) return;

            db.ref('announcements').orderByChild('timestamp').limitToLast(10).on('value', (snapshot) => {
                if (!snapshot.exists()) {
                    list.innerHTML = '<div style="color:#aaa;">Belum ada pengumuman.</div>';
                    return;
                }
                const items = [];
                snapshot.forEach(child => {
                    const data = child.val();
                    const key = child.key;
                    items.unshift(`
                        <div class="card mb-2" style="background:rgba(30,30,45,0.7);color:#fff;border:1px solid #6a11cb;">
                            <div class="card-body py-2 px-3">
                                <div style="font-weight:600;font-size:1.1em;">
                                    <i class="fas fa-bullhorn text-warning"></i> ${data.title}
                                </div>
                                <div style="font-size:0.98em;">${data.message}</div>
                                <div class="text-end" style="font-size:0.85em;color:#aaa;">
                                    <i class="fas fa-user-shield"></i> ${data.author || 'Admin'} &bull; 
                                    <i class="fas fa-clock"></i> ${new Date(data.timestamp).toLocaleString('id-ID')}
                                </div>
                                <button class="btn btn-warning btn-sm mt-2 edit-announcement-btn" data-key="${key}" data-title="${encodeURIComponent(data.title)}" data-message="${encodeURIComponent(data.message)}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger btn-sm mt-2 delete-announcement-btn" data-key="${key}">
                                    <i class="fas fa-trash"></i> Hapus
                                </button>
                            </div>
                        </div>
                    `);
                });
                list.innerHTML = items.join('');
            });
        }

        // Event listener untuk tombol hapus pengumuman
        document.addEventListener('click', function(e) {
            if (e.target.closest('.delete-announcement-btn')) {
                const btn = e.target.closest('.delete-announcement-btn');
                const key = btn.getAttribute('data-key');
                if (confirm('Hapus pengumuman ini?')) {
                    db.ref('announcements/' + key).remove()
                        .then(() => showNotification('Pengumuman dihapus', 'success'))
                        .catch(err => showNotification('Gagal menghapus: ' + err.message, 'error'));
                }
            }
        });

        // Event listener untuk tombol edit pengumuman
        document.addEventListener('click', function(e) {
            if (e.target.closest('.edit-announcement-btn')) {
                const btn = e.target.closest('.edit-announcement-btn');
                const key = btn.getAttribute('data-key');
                const title = decodeURIComponent(btn.getAttribute('data-title'));
                const message = decodeURIComponent(btn.getAttribute('data-message'));

                // Isi form dengan data pengumuman yang dipilih
                document.getElementById('announcementTitle').value = title;
                document.getElementById('announcementMessage').value = message;
                document.getElementById('postAnnouncementBtn').style.display = 'none';

                // Tambahkan tombol update jika belum ada
                let updateBtn = document.getElementById('updateAnnouncementBtn');
                if (!updateBtn) {
                    updateBtn = document.createElement('button');
                    updateBtn.id = 'updateAnnouncementBtn';
                    updateBtn.className = 'btn btn-success';
                    updateBtn.innerHTML = '<i class="fas fa-save"></i> Update Pengumuman';
                    document.getElementById('announcementMessage').parentElement.appendChild(updateBtn);
                } else {
                    updateBtn.style.display = '';
                }

                // Event update
                updateBtn.onclick = function() {
                    const newTitle = document.getElementById('announcementTitle').value.trim();
                    const newMessage = document.getElementById('announcementMessage').value.trim();
                    if (!newTitle || !newMessage) {
                        showNotification('Judul dan isi pengumuman harus diisi!', 'error');
                        return;
                    }
                    db.ref('announcements/' + key).update({
                        title: newTitle,
                        message: newMessage
                    }).then(() => {
                        showNotification('Pengumuman berhasil diupdate!', 'success');
                        document.getElementById('announcementTitle').value = '';
                        document.getElementById('announcementMessage').value = '';
                        updateBtn.style.display = 'none';
                        document.getElementById('postAnnouncementBtn').style.display = '';
                    }).catch((error) => {
                        showNotification('Gagal update: ' + error.message, 'error');
                    });
                };
            }
        });

        // Panggil saat DOM siap
        document.addEventListener('DOMContentLoaded', function () {
            loadAdminAnnouncements();

            // Cek status autentikasi
            auth.onAuthStateChanged((user) => {
                if (!user) {
                    window.location.href = 'login.html';
                } else {
                    // Set default datetime to now
                    const now = new Date();
                    const timezoneOffset = now.getTimezoneOffset() * 60000;
                    const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
                    document.getElementById('poDatetime').value = localISOTime;

                    // Load data
                    loadQueueData();
                }
            });
        });

        document.getElementById('addRowBtn').addEventListener('click', () => {
            const newRow = addQueueRow();
            newRow.scrollIntoView({ behavior: 'smooth' });
            showNotification('Antrian baru ditambahkan', 'success');
        });

        document.getElementById('saveBtn').addEventListener('click', saveQueueData);
        document.getElementById('deleteAllBtn').addEventListener('click', deleteAllData);
        document.getElementById('postAnnouncementBtn').addEventListener('click', postAnnouncement);

        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'login.html';
            });
        });

        document.getElementById('antrianInputs').addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const queueItem = e.target.closest('.queue-item');
                const nameInput = queueItem.querySelector('input[type="text"]');
                const customerName = nameInput ? nameInput.value || 'Antrian' : 'Antrian';

                if (confirm(`Hapus ${customerName} dari daftar antrian?`)) {
                    queueItem.classList.add('fade-out');
                    setTimeout(() => {
                        queueItem.remove();
                        showNotification(`${customerName} dihapus dari antrian`, 'success');
                    }, 300);
                }
            }
        });