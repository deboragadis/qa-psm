import { db, COLLECTION_NAME } from "./firebase.js";
import { tampilkanNamaUser } from "./common.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let dbSistem = [];
let barChartInstance = null;
let donutChartInstance = null;

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

document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await window.renderTabelTracking();
});

window.simpanDataBaru = async function() {
  const valProduct = document.getElementById("input-product").value;
  const valSN = document.getElementById("input-sn").value.trim();
  const valPO = document.getElementById("input-po") ? document.getElementById("input-po").value.trim() : "-";
  const valStartDate = document.getElementById("input-date1") ? document.getElementById("input-date1").value : "-";
  const valEndDate = document.getElementById("input-date2") ? document.getElementById("input-date2").value : "-";

  if (valSN === "") {
    alert("Peringatan: Serial Number harus diisi!");
    return;
  }

  const cekDuplikat = dbSistem.find((item) => item.sn === valSN);
  if (cekDuplikat) {
    alert(`Gagal! Serial Number ${valSN} sudah terdaftar di sistem.`);
    return;
  }

  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      product: valProduct,
      sn: valSN,
      po: valPO,
      startDate: valStartDate,
      endDate: valEndDate,
      progres: 0,
      status: "New",
      createdAt: new Date()
    });
    alert("Sukses! Data Sistem berhasil disimpan ke Cloud.");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    alert("Terjadi kesalahan saat menyimpan ke cloud.");
  }
};

window.hapusData = async function(docId, sn) {
  const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus data dengan SN: ${sn}?`);
  if (!konfirmasi) return;

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
    alert("Data berhasil dihapus dari Cloud!");
    window.renderTabelTracking();
  } catch (error) {
    console.error("Gagal menghapus data:", error);
    alert("Gagal menghapus data.");
  }
};

function updateSummaryBoxes() {
  const totalRI = dbSistem.filter(item => item.product === "Rock Imager").length;
  const totalNT8 = dbSistem.filter(item => item.product === "NT8").length;
  const totalFormulator = dbSistem.filter(item => item.product === "Formulator").length;
  const totalQCSelesai = dbSistem.filter(item => item.progres === 100 || item.status === "Completed").length;
  const totalShipment = dbSistem.filter(item => item.status === "Shipped").length;

  const valueBoxes = document.querySelectorAll(".row .value-box p");
  if (valueBoxes.length >= 5) {
    valueBoxes[0].innerText = totalRI;
    valueBoxes[1].innerText = totalNT8;
    valueBoxes[2].innerText = totalFormulator;
    valueBoxes[3].innerText = totalQCSelesai;
    valueBoxes[4].innerText = totalShipment;
  }
}

function renderCharts() {
  const barCtx = document.getElementById('barChart');
  if (barCtx) {
    const labels = dbSistem.map(item => item.sn);
    const dataProgres = dbSistem.map(item => item.progres);
    if (barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Belum Ada Data'],
        datasets: [{ label: 'Progres (%)', data: dataProgres.length > 0 ? dataProgres : [0], backgroundColor: '#3b82f6', borderRadius: 6 }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
    });
  }

  const donutCtx = document.getElementById('donutChart');
  if (donutCtx) {
    const countRI = dbSistem.filter(item => item.product === 'Rock Imager').length;
    const countNT8 = dbSistem.filter(item => item.product === 'NT8').length;
    const countFormulator = dbSistem.filter(item => item.product === 'Formulator').length;
    if (donutChartInstance) donutChartInstance.destroy();

    donutChartInstance = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Rock Imager', 'NT8', 'Formulator'],
        datasets: [{ data: [countRI, countNT8, countFormulator], backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'] }]
      },
      options: { responsive: true }
    });
  }
}

window.renderTabelTracking = async function() {
  const tbody = document.getElementById("tabel-tracking");
  if (!tbody) return; 

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">Memuat data dari Cloud...</td></tr>`;
  await fetchAllData();
  tbody.innerHTML = "";

  if (dbSistem.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">Data kosong. Silakan Input Sistem Baru.</td></tr>`;
    updateSummaryBoxes();
    renderCharts();
    return;
  }

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
        <button onclick="hapusData('${item.id}', '${item.sn}')" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
          <i class="fas fa-trash"></i> Hapus
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateSummaryBoxes();
  renderCharts();
};

window.exportToCSV = function() {
  if (!dbSistem || dbSistem.length === 0) {
    alert("Tidak ada data yang bisa diexport! Data masih kosong.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Product,Serial Number,PO Number,Start Date,End Date,Progres (%),Status\n";
  dbSistem.forEach(item => {
    let row = [`"${item.product || ''}"`, `"${item.sn || ''}"`, `"${item.po || ''}"`, `"${item.startDate || ''}"`, `"${item.endDate || ''}"`, `"${item.progres || 0}"`, `"${item.status || ''}"`];
    csvContent += row.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "data_sitraq_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.importFromCSV = async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const text = e.target.result;
    const lines = text.split("\n");
    let successCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').trim());
      
      if (cols.length >= 2) {
        const [product, sn, po, startDate, endDate, progres, status] = cols;
        if (sn) {
          try {
            await addDoc(collection(db, COLLECTION_NAME), {
              product: product || "NT8", sn, po: po || "-", startDate: startDate || "-", endDate: endDate || "-", progres: Number(progres) || 0, status: status || "New", createdAt: new Date()
            });
            successCount++;
          } catch (err) { console.error(err); }
        }
      }
    }
    alert(`Import selesai! Berhasil menambahkan ${successCount} data ke Cloud.`);
    event.target.value = ""; 
    window.renderTabelTracking(); 
  };
  reader.readAsText(file);
};