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

// Logika Interaktif: Status PO "Ada PO" vs "Belum ada PO"
window.toggleStatusPO = function() {
  const statusPO = document.getElementById("input-status-po").value;
  const inputPO = document.getElementById("update-po");
  const inputCustomer = document.getElementById("update-customer");
  const inputPlanShipped = document.getElementById("input-plan-shipped");

  if (statusPO === "Belum ada PO") {
    if (inputPO) {
      inputPO.value = "Belum ada PO";
      inputPO.disabled = true;
      inputPO.style.backgroundColor = "#f1f5f9";
      inputPO.style.color = "#64748b";
    }

    if (inputCustomer) {
      inputCustomer.value = "Belum ada PO";
      inputCustomer.disabled = true;
      inputCustomer.style.backgroundColor = "#f1f5f9";
      inputCustomer.style.color = "#64748b";
    }

    if (inputPlanShipped) {
      inputPlanShipped.value = "";
      inputPlanShipped.disabled = true;
      inputPlanShipped.style.backgroundColor = "#f1f5f9";
      inputPlanShipped.style.color = "#64748b";
      inputPlanShipped.style.cursor = "not-allowed";
    }
  } else {
    if (inputPO) {
      inputPO.disabled = false;
      inputPO.style.backgroundColor = "#ffffff";
      inputPO.style.color = "#000000";
      if (inputPO.value === "Belum ada PO") inputPO.value = "";
    }

    if (inputCustomer) {
      inputCustomer.disabled = false;
      inputCustomer.style.backgroundColor = "#ffffff";
      inputCustomer.style.color = "#000000";
      if (inputCustomer.value === "Belum ada PO") inputCustomer.value = "";
    }

    if (inputPlanShipped) {
      inputPlanShipped.disabled = false;
      inputPlanShipped.style.backgroundColor = "#ffffff";
      inputPlanShipped.style.color = "#000000";
      inputPlanShipped.style.cursor = "pointer";
      if (!inputPlanShipped.value) {
        inputPlanShipped.value = new Date().toISOString().split('T')[0];
      }
    }
  }
};

// Muat detail data saat Serial Number dipilih
window.muatDetailUpdate = function() {
  const selectedSN = document.getElementById("update-sn").value;
  const targetItem = dbSistem.find(item => item.sn === selectedSN);

  const container = document.getElementById("checklist-container");
  
  if (!targetItem) {
    document.getElementById("input-status-po").value = "Belum ada PO";
    document.getElementById("update-customer").value = "";
    document.getElementById("update-po").value = "";
    document.getElementById("input-plan-shipped").value = "";
    document.getElementById("input-date2").value = "";
    document.getElementById("update-progres").value = "0";
    document.getElementById("label-progres").innerText = "0%";
    toggleStatusPO();
    if (container) {
      container.innerHTML = `<p style="color: #64748b; font-style: italic;">Silakan pilih Serial Number terlebih dahulu untuk memuat checklist.</p>`;
    }
    return;
  }

  const statusPoVal = targetItem.statusPo || (targetItem.po && targetItem.po !== "Belum ada PO" ? "Ada PO" : "Belum ada PO");
  document.getElementById("input-status-po").value = statusPoVal;
  toggleStatusPO();

  if (statusPoVal === "Ada PO") {
    document.getElementById("update-customer").value = targetItem.customer || "";
    document.getElementById("update-po").value = targetItem.po || "";
    document.getElementById("input-plan-shipped").value = targetItem.planShipped && targetItem.planShipped !== "-" ? targetItem.planShipped : "";
  }

  document.getElementById("input-date2").value = targetItem.endDate && targetItem.endDate !== "-" ? targetItem.endDate : "";

  let savedChecklist = targetItem.checklist || {};
  let html = `<h3 style="margin-bottom: 15px; font-size: 15px; color: #1e293b;">Checklist untuk: ${targetItem.product} (${targetItem.optional || '-'})</h3>`;

  const productName = targetItem.product;
  const optionalVal = (targetItem.optional || "").toUpperCase();

  if (productName === "Formulator") {
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
    // Rock Imager / RI360
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

// Hitung persentase progres secara otomatis & kelola aktifnya End Date QC berdasarkan "Final QA"
window.hitungProgresOtomatis = function() {
  const checkboxes = document.querySelectorAll(".qc-checkbox");
  if (checkboxes.length === 0) return;

  let totalCheck = checkboxes.length;
  let checkedCount = 0;
  let isFinalQAChecked = false;
  let isAllChecked = true;

  checkboxes.forEach(cb => {
    if (cb.checked) checkedCount++;
    else isAllChecked = false;

    let key = cb.getAttribute("data-key");
    if (key === "Final QA" && cb.checked) {
      isFinalQAChecked = true;
    }
  });

  let percentage = Math.round((checkedCount / totalCheck) * 100);
  
  const inputProgres = document.getElementById("update-progres");
  const labelProgres = document.getElementById("label-progres");
  const inputDate2 = document.getElementById("input-date2");

  if (inputProgres) inputProgres.value = percentage;
  if (labelProgres) labelProgres.innerText = percentage + "%";

  // End Date QC aktif apabila checkbox "Final QA" sudah tercentang
  if (inputDate2) {
    if (isFinalQAChecked) {
      inputDate2.disabled = false;
      inputDate2.style.backgroundColor = "#ffffff";
      inputDate2.style.color = "#000000";
      inputDate2.style.cursor = "pointer";
      if (!inputDate2.value || inputDate2.value === "-") {
        inputDate2.value = new Date().toISOString().split('T')[0];
      }
    } else {
      inputDate2.disabled = true;
      inputDate2.style.backgroundColor = "#f1f5f9";
      inputDate2.style.color = "#64748b";
      inputDate2.style.cursor = "not-allowed";
      inputDate2.value = "";
    }
  }
};

// Simpan perubahan progres, logistik PO, dan End Date QC ke Cloud Firestore
window.simpanUpdateProgres = async function() {
  const selectedSN = document.getElementById("update-sn").value;
  const newProgres = Number(document.getElementById("update-progres") ? document.getElementById("update-progres").value : 0);
  const statusPoVal = document.getElementById("input-status-po").value;
  const customerVal = statusPoVal === "Belum ada PO" ? "Belum ada PO" : (document.getElementById("update-customer").value.trim() || "-");
  const poVal = statusPoVal === "Belum ada PO" ? "Belum ada PO" : (document.getElementById("update-po").value.trim() || "-");
  const planShippedVal = statusPoVal === "Belum ada PO" ? "-" : (document.getElementById("input-plan-shipped").value || "-");
  
  let finalQAChecked = false;
  let allChecked = true;
  const checkboxes = document.querySelectorAll(".qc-checkbox");
  checkboxes.forEach(cb => {
    if (cb.getAttribute("data-key") === "Final QA" && cb.checked) {
      finalQAChecked = true;
    }
    if (!cb.checked) {
      allChecked = false;
    }
  });

  const endDateVal = finalQAChecked ? (document.getElementById("input-date2").value || "-") : "-";

  if (!selectedSN) {
    alert("Peringatan: Silakan pilih Serial Number terlebih dahulu!");
    return;
  }

  const targetItem = dbSistem.find(item => item.sn === selectedSN);
  if (!targetItem) {
    alert("Data tidak ditemukan!");
    return;
  }

  let checklistData = {};
  checkboxes.forEach(cb => {
    let key = cb.getAttribute("data-key");
    checklistData[key] = cb.checked;
  });

  // Logika Status: 
  // Jika semua checklist tercentang (allChecked), status menjadi "Shipped" (sehingga QC Selesai di dashboard box menjadi 0 dan Shipment bertambah)
  // Jika Final QA tercentang tetapi belum semua, status "Completed" (QC Selesai bertambah 1)
  let newStatus = "In Progress";
  if (allChecked) {
    newStatus = "Shipped";
  } else if (finalQAChecked || newProgres === 100) {
    newStatus = "Completed";
  } else if (newProgres === 0) {
    newStatus = "New";
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, targetItem.id);
    await updateDoc(docRef, {
      statusPo: statusPoVal,
      customer: customerVal,
      po: poVal,
      planShipped: planShippedVal,
      progres: newProgres,
      status: newStatus,
      endDate: endDateVal,
      checklist: checklistData
    });

    alert(`Sukses! Progres untuk SN ${selectedSN} berhasil diperbarui.`);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Gagal mengupdate progres:", error);
    alert("Terjadi kesalahan saat memperbarui data di Cloud.");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await fetchAllData();
  populateUpdateDropdown();
  toggleStatusPO();
});
