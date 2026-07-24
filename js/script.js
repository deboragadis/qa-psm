// =========================================================================
// 1. AMBIL DATA USER LOGIN DARI STORAGE
// =========================================================================
const currentUser = localStorage.getItem("loggedInUser") || "Guest";

// Fungsi untuk mengganti nama di layar (Dashboard Header)
function tampilkanNamaUser(username) {
  const elemenNama = document.getElementById("nama-user");

  if (elemenNama) {
    const namaFormat = username.charAt(0).toUpperCase() + username.slice(1);
    elemenNama.innerText = namaFormat;
  }
}

// Menjalankan fungsi otomatis saat elemen HTML selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  tampilkanNamaUser(currentUser);
  renderTabelTracking();
});

// =========================================================================
// 2. MANAJEMEN TAB SIDEBAR
// =========================================================================
function showTab(tabId) {
  const contents = document.querySelectorAll(".tab-content");
  contents.forEach((content) => {
    content.classList.remove("active");
  });

  const menuItems = document.querySelectorAll(".sidebar-menu li");
  menuItems.forEach((item) => {
    item.classList.remove("active");
  });

  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add("active");
  }

  const activeMenu = Array.from(menuItems).find((item) => {
    const onclickAttr = item.getAttribute("onclick");
    return onclickAttr && onclickAttr.includes(tabId);
  });
  
  if (activeMenu) {
    activeMenu.classList.add("active");
  }
}

// =========================================================================
// 3. LOGIKA LOGOUT
// =========================================================================
function logoutUser() {
  const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");

  if (konfirmasi) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("active_user_role");
    window.location.href = "index.html";
  }
}

// =========================================================================
// 4. LOGIKA DATABASE SEMENTARA & CRUD
// =========================================================================

// Mengambil data dari localStorage browser
let dbSistem = JSON.parse(localStorage.getItem("dataXTAL")) || [];

// Fungsi untuk menyimpan data dari form Input Sistem Baru
function simpanDataBaru() {
  const valProduct = document.getElementById("input-product").value;
  const valSN = document.getElementById("input-sn").value.trim();
  const valStartDate = document.getElementById("input-date1") ? document.getElementById("input-date1").value : "-";
  const valEndDate = document.getElementById("input-date2") ? document.getElementById("input-date2").value : "-";

  // Validasi: Cek input kosong
  if (valSN === "") {
    alert("Peringatan: Serial Number harus diisi!");
    return;
  }

  // Validasi: Cek duplikat Serial Number
  const cekDuplikat = dbSistem.find((item) => item.sn === valSN);
  if (cekDuplikat) {
    alert(`Gagal! Serial Number ${valSN} sudah terdaftar di sistem.`);
    return;
  }

  // Objek data baru
  const dataBaru = {
    product: valProduct,
    sn: valSN,
    startDate: valStartDate,
    endDate: valEndDate,
    progres: 0,
    status: "New",
  };

  // Simpan ke array dan localStorage
  dbSistem.push(dataBaru);
  localStorage.setItem("dataXTAL", JSON.stringify(dbSistem));

  alert("Sukses! Data Sistem berhasil disimpan.");

  // Reset input form
  document.getElementById("input-sn").value = "";
  if (document.getElementById("input-date1")) document.getElementById("input-date1").value = "";
  if (document.getElementById("input-date2")) document.getElementById("input-date2").value = "";

  // Perbarui tabel dan arahkan ke tab tracking
  renderTabelTracking();
  showTab("tracking");
}

// Fungsi untuk menghapus data berdasarkan Serial Number (SN)
function hapusData(sn) {
  const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus data dengan SN: ${sn}?`);
  if (!konfirmasi) return;

  // Filter array untuk membuang data yang memiliki SN yang sama
  dbSistem = dbSistem.filter((item) => item.sn !== sn);

  // Simpan kembali data terbaru ke localStorage
  localStorage.setItem("dataXTAL", JSON.stringify(dbSistem));

  alert("Data berhasil dihapus!");

  // Perbarui tampilan tabel dan ringkasan
  renderTabelTracking();
}

// Fungsi untuk memperbarui angka pada box ringkasan di bagian atas tracking
function updateSummaryBoxes() {
  const totalSistem = dbSistem.length;
  const totalNT8 = dbSistem.filter(item => item.product === "NT8").length;
  const totalFormulator = dbSistem.filter(item => item.product === "Formulator").length;
  const totalQCSelesai = dbSistem.filter(item => item.progres === 100 || item.status === "Completed").length;
  const totalShipment = dbSistem.filter(item => item.status === "Shipped").length;

  const valueBoxes = document.querySelectorAll("#tracking .value-box p");
  if (valueBoxes.length >= 5) {
    valueBoxes[0].innerText = totalSistem;
    valueBoxes[1].innerText = totalNT8;
    valueBoxes[2].innerText = totalFormulator;
    valueBoxes[3].innerText = totalQCSelesai;
    valueBoxes[4].innerText = totalShipment;
  }
}

// Fungsi untuk menampilkan (me-render) isi data ke dalam Tabel Tracking Overview
function renderTabelTracking() {
  const tbody = document.getElementById("tabel-tracking");
  if (!tbody) return; 

  tbody.innerHTML = "";

  // Jika data kosong
  if (dbSistem.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">Data kosong. Silakan Input Sistem Baru.</td></tr>`;
    updateSummaryBoxes();
    return;
  }

  // Looping data ke baris tabel
  dbSistem.forEach((item) => {
    const tr = document.createElement("tr");
    let statusWarna = item.progres === 100 ? "#10b981" : "#3b82f6";

    tr.innerHTML = `
      <td style="font-weight: 600;">${item.product}</td>
      <td>${item.sn}</td>
      <td style="color: #64748b;">${item.startDate} s/d ${item.endDate}</td>
      <td><strong>${item.progres}%</strong></td>
      <td><span style="background-color: ${statusWarna}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${item.status}</span></td>
      <td>
        <button onclick="hapusData('${item.sn}')" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
          <i class="fas fa-trash"></i> Hapus
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update angka ringkasan
  updateSummaryBoxes();
}
