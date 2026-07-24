import { db, COLLECTION_NAME } from "./firebase.js";
import { tampilkanNamaUser } from "./common.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let dbSistem = [];

// Tarik data dari Cloud Firestore
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

// Masukkan data SN ke elemen dropdown `<select>`
function populateUpdateDropdown() {
  const selectSN = document.getElementById("update-sn");
  if (!selectSN) return;

  selectSN.innerHTML = `<option value="">-- Pilih SN Sistem --</option>`;
  dbSistem.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.sn;
    opt.textContent = `${item.sn} (${item.product})`;
    selectSN.appendChild(opt);
  });
}

// Otomatis isi kolom progres & status saat SN dipilih
window.isiOtomatisUpdate = function() {
  const selectedSN = document.getElementById("update-sn").value;
  const targetItem = dbSistem.find(item => item.sn === selectedSN);

  if (targetItem) {
    document.getElementById("update-progres").value = targetItem.progres || 0;
    document.getElementById("update-status").value = targetItem.status || "New";
  } else {
    document.getElementById("update-progres").value = "";
    document.getElementById("update-status").value = "New";
  }
};

// Simpan perubahan progres ke Cloud Firestore
window.simpanUpdateProgres = async function() {
  const selectedSN = document.getElementById("update-sn").value;
  const newProgres = Number(document.getElementById("update-progres").value);
  const newStatus = document.getElementById("update-status").value;

  if (!selectedSN) {
    alert("Peringatan: Silakan pilih Serial Number terlebih dahulu!");
    return;
  }

  if (newProgres < 0 || newProgres > 100) {
    alert("Peringatan: Progres harus di antara 0 hingga 100!");
    return;
  }

  const targetItem = dbSistem.find(item => item.sn === selectedSN);
  if (!targetItem) {
    alert("Data tidak ditemukan!");
    return;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, targetItem.id);
    await updateDoc(docRef, {
      progres: newProgres,
      status: newStatus
    });

    alert(`Sukses! Progres untuk SN ${selectedSN} berhasil diperbarui.`);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Gagal mengupdate progres:", error);
    alert("Terjadi kesalahan saat memperbarui data di Cloud.");
  }
};

// Inisialisasi saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await fetchAllData();
  populateUpdateDropdown();
});