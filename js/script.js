// =========================================================================
// 1. AMBIL DATA USER LOGIN DARI STORAGE
// =========================================================================
// Mengambil username yang disimpan saat proses login. Jika belum ada, tampilkan "Guest"
const currentUser = localStorage.getItem("loggedInUser") || "Guest";

// Fungsi untuk mengganti nama di layar (Dashboard Header)
function tampilkanNamaUser(username) {
  const elemenNama = document.getElementById("nama-user");

  if (elemenNama) {
    // Membuat huruf pertama menjadi kapital agar lebih rapi
    const namaFormat = username.charAt(0).toUpperCase() + username.slice(1);
    elemenNama.innerText = namaFormat;
  }
}

// Menjalankan fungsi otomatis saat elemen HTML sudah selesai dimuat oleh browser
document.addEventListener("DOMContentLoaded", () => {
  tampilkanNamaUser(currentUser);

  // --- TAMBAHAN BARU: Langsung panggil isi tabel Tracking agar tidak kosong ---
  renderTabelTracking();
});

// =========================================================================
// 2. MANAJEMEN TAB SIDEBAR
// =========================================================================
// Fungsi untuk mengatur pergantian Tab Menu di Sidebar
function showTab(tabId) {
  // 1. Sembunyikan semua konten tab
  const contents = document.querySelectorAll(".tab-content");
  contents.forEach((content) => {
    content.classList.remove("active");
  });

  // 2. Hapus highlight 'active' dari semua menu sidebar
  const menuItems = document.querySelectorAll(".sidebar-menu li");
  menuItems.forEach((item) => {
    item.classList.remove("active");
  });

  // 3. Tampilkan tab yang dipilih
  document.getElementById(tabId).classList.add("active");

  // 4. Tambahkan highlight pada menu yang di-klik
  const activeMenu = Array.from(menuItems).find((item) =>
    item.getAttribute("onclick").includes(tabId),
  );
  if (activeMenu) {
    activeMenu.classList.add("active");
  }
}

// =========================================================================
// 3. LOGIKA LOGOUT
// =========================================================================
function logoutUser() {
  // Memunculkan pop-up konfirmasi
  const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");

  if (konfirmasi) {
    // Hapus data sesi/login dari memori browser
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("active_user_role");

    // Arahkan kembali ke halaman login.
    // (Ganti 'login.html' dengan nama file halaman login kamu yang sebenarnya)
    window.location.href = "login.html";
  }
}

// =========================================================================
// 4. LOGIKA DATABASE SEMENTARA (CRUD SIMULASI)
// =========================================================================

// Mengambil data yang sudah pernah disimpan dari localStorage browser
// Jika masih kosong (baru pertama kali buka), buat array kosong []
let dbSistem = JSON.parse(localStorage.getItem("dataXTAL")) || [];

// Fungsi untuk menyimpan data dari form Input Sistem Baru
function simpanDataBaru() {
  const valProduct = document.getElementById("input-product").value;
  const valSN = document.getElementById("input-sn").value.trim();

  // Validasi: Cegah simpan kalau inputan Serial Number (SN) kosong
  if (valSN === "") {
    alert("Peringatan: Serial Number harus diisi!");
    return;
  }

  // Validasi: Cegah SN duplikat (tidak boleh ada SN yang sama)
  const cekDuplikat = dbSistem.find((item) => item.sn === valSN);
  if (cekDuplikat) {
    alert(`Gagal! Serial Number ${valSN} sudah terdaftar di sistem.`);
    return;
  }

  // Bungkus data baru yang akan disimpan
  const dataBaru = {
    product: valProduct,
    sn: valSN,
    customer: "Belum Ada PO", // Default kosong
    progres: 0,
    status: "New",
  };

  // Masukkan ke dalam array dan simpan secara permanen di memori browser (localStorage)
  dbSistem.push(dataBaru);
  localStorage.setItem("dataXTAL", JSON.stringify(dbSistem));

  alert("Sukses! Data Sistem berhasil disimpan.");

  // Reset / kosongkan inputan SN setelah berhasil disimpan
  document.getElementById("input-sn").value = "";

  // Langsung perbarui tampilan tabel dan otomatis pindah ke tab Tracking Overview
  renderTabelTracking();
  showTab("tracking");
}

// Fungsi untuk menampilkan (me-render) isi data ke dalam Tabel Tracking Overview
function renderTabelTracking() {
  const tbody = document.getElementById("tabel-tracking");

  // Bersihkan isi tabel sebelum diisi ulang agar datanya tidak berlipat ganda
  if (!tbody) return; // Mencegah error jika elemen tidak ditemukan
  tbody.innerHTML = "";

  // Jika belum ada data sama sekali di dalam dbSistem
  if (dbSistem.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">Data kosong. Silakan Input Sistem Baru.</td></tr>`;
    return;
  }

  // Looping / putar data dan cetak baris HTML untuk setiap datanya
  dbSistem.forEach((item) => {
    const tr = document.createElement("tr");

    // Buat warna badge status (Hijau jika progres 100%, Biru jika belum)
    let statusWarna = item.progres === 100 ? "#10b981" : "#3b82f6";

    tr.innerHTML = `
            <td style="font-weight: 600;">${item.product}</td>
            <td>${item.sn}</td>
            <td style="color: #64748b;">${item.customer}</td>
            <td><strong>${item.progres}%</strong></td>
            <td><span style="background-color: ${statusWarna}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${item.status}</span></td>
        `;
    tbody.appendChild(tr);
  });
}
