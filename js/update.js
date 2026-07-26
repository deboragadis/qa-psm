// =========================================================================
// INISIALISASI FIREBASE & SDK
// =========================================================================
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

  selectSN.innerHTML = `<option value="">-- Pilih Serial Number --</option>`;
  dbSistem.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.sn;
    opt.textContent = `${item.sn} (${item.product})`;
    selectSN.appendChild(opt);
  });
}

// Muat detail data, informasi customer/PO, dan render checklist dinamis berdasarkan produk
window.muatDetailUpdate = function() {
  const selectedSN = document.getElementById("update-sn").value;
  const targetItem = dbSistem.find(item => item.sn === selectedSN);

  const container = document.getElementById("checklist-container");
  
  if (!targetItem) {
    document.getElementById("update-customer").value = "";
    document.getElementById("update-po").value = "";
    document.getElementById("update-end-date").value = "";
    document.getElementById("update-progres").value = "0";
    document.getElementById("label-progres").innerText = "0%";
    if (container) {
      container.innerHTML = `<p style="color: #64748b; font-style: italic;">Silakan pilih Serial Number terlebih dahulu untuk memuat checklist.</p>`;
    }
    return;
  }

  // Isi otomatis data logistik
  document.getElementById("update-customer").value = targetItem.customer || "Belum ada PO";
  document.getElementById("update-po").value = targetItem.po || "Belum ada PO";
  document.getElementById("update-end-date").value = targetItem.endDate && targetItem.endDate !== "-" ? targetItem.endDate : "";

  let savedChecklist = targetItem.checklist || {};
  let html = `<h3 style="margin-bottom: 15px; font-size: 15px; color: #1e293b;">Checklist untuk: ${targetItem.product}</h3>`;

  const productName = targetItem.product;
  const optionalVal = (targetItem.optional || "").toUpperCase();

  if (productName === "Formulator") {
    // 1. Checklist Formulator
    const formulatorItems = [
      "Software Set Up", "Leaking Test 1st", "General Check", "Drippan Test", 
      "BIM Washing", "Dead Volume 1st", "Stage", "Prime Test", "Check Board 1st", 
      "Volume Mapping", "CV Test", "24 Linbro CV Simulation", "Dead Volume 2nd", 
      "LeakingTest 2nd", "Volume Mapping 2nd", "Check Board 2nd", "Cleaning"
    ];
    
    const postQaItems = ["Final QA", "Post QA", "Packing", "Shipping"];

    html += `<div style="margin-bottom: 15px;"><h4 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">Main Checklist</h4><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">`;
    formulatorItems.forEach(key => {
      let isChecked = savedChecklist[key] ? "checked" : "";
      html += `<label style="font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer;"><input type="checkbox" class="qc-checkbox" data-key="${key}" ${isChecked} onchange="hitungProgresOtomatis()" style="accent-color: #3b82f6;"> ${key}</label>`;
    });
    html += `</div></div>`;

    html += `<div style="margin-bottom: 15px;"><h4 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">Post QA</h4><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">`;
    postQaItems.forEach(key => {
      let isChecked = savedChecklist[key] ? "checked" : "";
      html += `<label style="font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer;"><input type="checkbox" class="qc-checkbox" data-key="${key}" ${isChecked} onchange="hitungProgresOtomatis()" style="accent-color: #3b82f6;"> ${key}</label>`;
    });
    html += `</div></div>`;

  } else if (productName === "NT8") {
    // 2. Checklist NT8 (dengan kondisi LCP & PC check)
    const showLCP = optionalVal.includes("LCP");
    const showPC = optionalVal.includes("PC");

    const qc1Items = ["General Check", "Mechanichal Movement", "Dead Volume", "Contamination", "CV", "Sitting Drop", "Hanging Drop"];
    if (showLCP) qc1Items.push("LCP Check");
    if (showPC) qc1Items.push("PC Check");
    qc1Items.push("Lifetime Test");

    const qc2Items = ["Mechanical Movement", "Dead Volume", "Contamination", "CV", "Sitting Drop", "Hanging Drop"];
    if (showLCP) qc2Items.push("LCP Check");
    if (showPC) qc2Items.push("PC Check");

    const postQaItems = ["Final QA", "Post QA", "Packing", "Shipping"];

    html += `<div style="margin-bottom: 15px;"><h4 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">QC 1</h4><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">`;
    qc1Items.forEach(key => {
      let isChecked = savedChecklist[key] ? "checked" : "";
      html += `<label style="font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer;"><input type="checkbox" class="qc-checkbox" data-key="${key}" ${isChecked} onchange="hitungProgresOtomatis()" style="accent-color: #3b82f6;"> ${key}</label>`;
    });
    html += `</div></div>`;

    html += `<div style="margin-bottom: 15px;"><h4 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">QC 2</h4><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">`;
    qc2Items.forEach(key => {
      let isChecked = savedChecklist[key] ? "checked" : "";
      html += `<label style="font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer;"><input type="checkbox" class="qc-checkbox" data-key="${key}" ${isChecked} onchange="hitungProgresOtomatis()" style="accent-color: #3b82f6;"> ${key}</label>`;
    });
    html += `</div></div>`;

    html += `<div style="margin-bottom: 15px;"><h4 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">Post QA</h4><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">`;
    postQaItems.forEach(key => {
      let isChecked = savedChecklist[key] ? "checked" : "";
      html += `<label style="font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer;"><input type="checkbox" class="qc-checkbox" data-key="${key}" ${isChecked} onchange="hitungProgresOtomatis()" style="accent-color: #3b82f6;"> ${key}</label>`;
    });
    html += `</div></div>`;

  } else {
    // 3. Checklist Rock Imager / RI360
    const qaDeployment = ["Pre QA", "General Check", "Electronic Check", "Movement", "Tuning", "Testing"];
    const opticItems = ["Visible", "UV", "SLP", "MFI", "UVA"];
    const postQaItems = ["PC - Monitor", "Config Setting", "System properties", "CRM", "Documentation", "Shipping"];

    html += `<div style="margin-bottom: 15px;"><h4 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">QA and Deployment</h4><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">`;
    qaDeployment.forEach(key => {
      let isChecked = savedChecklist[key] ? "checked" : "";
      html += `<label style="font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer;"><input type="checkbox" class="qc-checkbox" data-key="${key}" ${isChecked} onchange="hitungProgresOtomatis()" style="accent-color: #3b82f6;"> ${key}</label>`;
    });
    html += `</div></div>`;

    html += `<div style="margin-bottom: 15px;"><h4 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">Optic (Optional)</h4><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">`;
    opticItems.forEach(key => {
      let isChecked = savedChecklist[key] ? "checked" : "";
      html += `<label style="font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer;"><input type="checkbox" class="qc-checkbox" data-key="${key}" ${isChecked} onchange="hitungProgresOtomatis()" style="accent-color: #3b82f6;"> ${key}</label>`;
    });
    html += `</div></div>`;

    html += `<div style="margin-bottom: 15px;"><h4 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">Post QA</h4><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">`;
    postQaItems.forEach(key => {
      let isChecked = savedChecklist[key] ? "checked" : "";
      html += `<label style="font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer;"><input type="checkbox" class="qc-checkbox" data-key="${key}" ${isChecked} onchange="hitungProgresOtomatis()" style="accent-color: #3b82f6;"> ${key}</label>`;
    });
    html += `</div></div>`;
  }

  if (container) {
    container.innerHTML = html;
  }
  hitungProgresOtomatis();
};

// Hitung persentase progres secara otomatis berdasarkan kotak checklist yang tercentang
window.hitungProgresOtomatis = function() {
  const checkboxes = document.querySelectorAll(".qc-checkbox");
  if (checkboxes.length === 0) return;

  let totalCheck = checkboxes.length;
  let checkedCount = 0;

  checkboxes.forEach(cb => {
    if (cb.checked) checkedCount++;
  });

  let percentage = Math.round((checkedCount / totalCheck) * 100);
  
  const inputProgres = document.getElementById("update-progres");
  const labelProgres = document.getElementById("label-progres");
  if (inputProgres) inputProgres.value = percentage;
  if (labelProgres) labelProgres.innerText = percentage + "%";
};

// Simpan perubahan progres & checklist ke Cloud Firestore
window.simpanUpdateProgres = async function() {
  const selectedSN = document.getElementById("update-sn").value;
  const newProgres = Number(document.getElementById("update-progres") ? document.getElementById("update-progres").value : 0);
  const endDateVal = document.getElementById("update-end-date") ? document.getElementById("update-end-date").value : "";

  if (!selectedSN) {
    alert("Peringatan: Silakan pilih Serial Number terlebih dahulu!");
    return;
  }

  const targetItem = dbSistem.find(item => item.sn === selectedSN);
  if (!targetItem) {
    alert("Data tidak ditemukan!");
    return;
  }

  // Kumpulkan status centang checklist
  let checklistData = {};
  const checkboxes = document.querySelectorAll(".qc-checkbox");
  checkboxes.forEach(cb => {
    let key = cb.getAttribute("data-key");
    checklistData[key] = cb.checked;
  });

  // Tentukan status otomatis berdasarkan persentase progres
  let newStatus = "In Progress";
  if (newProgres === 100) {
    newStatus = "Completed";
  } else if (newProgres === 0) {
    newStatus = "New";
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, targetItem.id);
    await updateDoc(docRef, {
      progres: newProgres,
      status: newStatus,
      endDate: endDateVal || targetItem.endDate || "-",
      checklist: checklistData
    });

    alert(`Sukses! Progres untuk SN ${selectedSN} berhasil diperbarui menjadi ${newProgres}%.`);
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
