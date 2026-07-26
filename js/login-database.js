// File: database.js

const registeredAccounts = [
  // Format: { username: "nama", password: "password", role: "hak_akses" }
  { username: "gadis", password: "adminkeren123", role: "superadmin" },
  { username: "andi", password: "0000", role: "manager" },
  { username: "ari", password: "0000", role: "manager" },
  { username: "taufan", password: "0000", role: "manager" },
  { username: "yanuar", password: "12345", role: "staff" },
  { username: "febbry", password: "12345", role: "staff" },
  { username: "debora", password: "12345", role: "staff" },
  { username: "bima", password: "12345", role: "staff" },
  
];

localStorage.setItem("active_user_role", akunDitemukan.role);
