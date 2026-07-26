// Waktu idle dalam milidetik (30 detik = 30000 ms)
// Catatan: Jika nanti dirasa terlalu cepat untuk penggunaan nyata, bisa diganti misal ke 15 menit (900000 ms)
const IDLE_TIMEOUT = 30000; 

let idleTimer;

function logoutDueToIdle() {
  alert("Session habis karena tidak ada aktivitas selama 30 detik. Anda akan otomatis keluar.");
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("active_user_role");
  window.location.href = "index.html";
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(logoutDueToIdle, IDLE_TIMEOUT);
}

// Daftar aktivitas yang mendeteksi interaksi user
const events = ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress'];

events.forEach(event => {
  window.addEventListener(event, resetIdleTimer, true);
});

// Jalankan timer saat pertama kali skrip dimuat
resetIdleTimer();
