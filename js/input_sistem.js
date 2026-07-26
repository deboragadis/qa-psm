// =========================================================================
// INISIALISASI FIREBASE & SDK
// =========================================================================
import { db, COLLECTION_NAME } from "./firebase.js";
import { tampilkanNamaUser } from "./common.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let dbSistem = [];

// Tarik data dari Cloud Firestore untuk validasi duplikat Serial Number
async function fetchAllData() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    dbSistem = [];
    querySnapshot.forEach((docSnap) => {
      dbSistem.push({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (error) {
    console.error("Gagal mengambil data dari Cloud:", error);
  }
}

// Logika Dinamis: Mengubah opsi "Optional Sistem" berdasarkan Produk yang dipilih
window.updateOptionalOptions = function() {
  const product = document.getElementById("input-product").value;
  const selectOptional = document.getElementById("input-optional");
  if (!selectOptional) return;

  // Set placeholder awal
  selectOptional.innerHTML = `<option value="" disabled selected>Choose Optional Sistem</option>`;

  if (product === "Formulator") {
    const capacities = ["10 SP", "16 SP", "34 SP"];
    const variants = ["Only", "Pumpbox"];
    
    capacities.forEach(cap => {
      variants.forEach(variant => {
        const textOpt = `${cap} ${variant}`;
        const el = document.createElement("option");
        el.value = textOpt;
        el.textContent = textOpt;
        selectOptional.appendChild(el);
      });
    });
  } else if (product === "NT8") {
    ["LV ONLY", "LV+LCP", "LV", "LCP"].forEach(opt => {
      const el = document.createElement("option");
      el.value = opt;
      el.textContent = opt;
      selectOptional.appendChild(el);
    });
  } else if (product === "RI360") {
    const optics = ["Visible", "UV", "SLP", "MFI", "UVA"];
    const variants = ["Only", "Chiller", "Peltier"];
    
    optics.forEach(optic => {
      variants.forEach(variant => {
        const textOpt = `${optic} ${variant}`;
        const el = document.createElement("option");
        el.value = textOpt;
        el.textContent = textOpt;
        selectOptional.appendChild(el);
      });
    });
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await fetchAllData();
  
  // Inisialisasi opsi optional sistem pertama kali saat halaman dimuat
  updateOptionalOptions();

  // Set tanggal default hari ini ke Start Date QC
  const today = new Date().toISOString().split('T')[0];
  if (document.getElementById("input-date1")) document.getElementById("input-date1").value = today;

  // Otomatis pilih PIC QC berdasarkan user yang sedang login dan kunci (disabled)
  const loggedInUser = localStorage.getItem("loggedInUser");
  const selectPic = document.getElementById("input-pic");
  if (loggedInUser && selectPic) {
    const formattedUser = loggedInUser.charAt(0).toUpperCase() + loggedInUser.slice(1).toLowerCase();
    
    let found = false;
    for (let option of selectPic.options) {
      if (option.value.toLowerCase() === formattedUser.toLowerCase()) {
        selectPic.value = option.value;
        found = true;
        break;
      }
    }
    
    // Jika nama user cocok dengan opsi PIC, kunci dropdown-nya
    if (found) {
      selectPic.disabled = true;
      selectPic.style.backgroundColor = "#f1f5f9";
      selectPic.style.color = "#64748b";
      selectPic.style.cursor = "not-allowed";
    }
  }
});

// Simpan Data Baru ke Cloud Firestore
window.simpanDataBaru = async function() {
  const product = document.getElementById("input-product").value;
  const sn = document.getElementById("input-sn").value.trim();
  const optional = document.getElementById("input-optional").value;
  
  // Mengambil nilai PIC QC (meskipun berstatus disabled tetap terbaca)
  const selectPic = document.getElementById("input-pic");
  const picQc = selectPic ? selectPic.value : "Guest";

  const startDate = document.getElementById("input-date1").value || "-";
  const endDate = "-"; // End Date non-aktif karena progres awal masih 0%

  if (sn === "") {
    alert("Peringatan: Serial Number harus diisi!");
    return;
  }

  // Validasi jika optional belum dipilih / masih berupa placeholder
  if (!optional) {
    alert("Peringatan: Silakan pilih Optional Sistem terlebih dahulu!");
    return;
  }

  const cekDuplikat = dbSistem.find((item) => item.sn === sn);
  if (cekDuplikat) {
    alert(`Gagal! Serial Number ${sn} sudah terdaftar di sistem.`);
    return;
  }

  try {
    const dataBaru = {
      product,
      sn,
      optional,
      picQc,
      startDate,
      endDate,
      progres: 0, // Progres awal 0%
      status: "New",
      createdAt: new Date()
    };

    await addDoc(collection(db, COLLECTION_NAME), dataBaru);
    alert("Sukses! Data Sistem berhasil disimpan ke Cloud.");

    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    alert("Terjadi kesalahan saat menyimpan ke cloud.");
  }
};

window.toggleSidebar = function() {
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("mobile-show");
  } else {
    sidebar.classList.toggle("sembunyi");
  }
};

window.logoutUser = function() {
  const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");
  if (konfirmasi) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("active_user_role");
    window.location.href = "index.html";
  }
};
