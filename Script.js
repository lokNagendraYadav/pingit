// DOM Elements
const form = document.getElementById("monitorForm");
const input = document.getElementById("websiteUrl");
const list = document.getElementById("monitoredList");
const intervalSelect = document.getElementById("pingInterval");
const createBtn = document.getElementById("createAccountBtn");
const signInNowBtn = document.getElementById("signInNowBtn");
const loginBtn = document.getElementById("loginBtn");
const loginForm = document.getElementById("loginForm");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");
const formTitle = document.getElementById("formTitle");
const toggleToSignIn = document.getElementById("toggleToSignIn");
const toggleToCreate = document.getElementById("toggleToCreate");

const backendURL = "https://pingit-backend.onrender.com";

// Popup Logic
function openForm() {
  overlay.classList.remove("hidden");
  loginForm.classList.remove("hidden");
  loginForm.offsetWidth;
  loginForm.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeForm() {
  loginForm.classList.remove("active");
  overlay.classList.add("hidden");
  setTimeout(() => {
    loginForm.classList.add("hidden");
    document.body.style.overflow = "";
  }, 300);
}

loginBtn.addEventListener("click", openForm);
overlay.addEventListener("click", closeForm);
closeBtn.addEventListener("click", closeForm);

// Register
createBtn.addEventListener("click", async () => {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  const res = await fetch(`${backendURL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  alert(data.message || "Account created");

  if (res.ok) {
    localStorage.setItem("loggedIn", "true");
    loadMonitoredSites();
    closeForm();
  }
});

// Login
signInNowBtn.addEventListener("click", async () => {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  const res = await fetch(`${backendURL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  alert(data.message || "Logged in");

  if (res.ok) {
    localStorage.setItem("loggedIn", "true");
    loadMonitoredSites();
    closeForm();
  }
});

// Toggle
toggleToSignIn.addEventListener("click", () => {
  formTitle.textContent = "Sign In";
  createBtn.classList.add("hidden");
  signInNowBtn.classList.remove("hidden");
  toggleToSignIn.classList.add("hidden");
  toggleToCreate.classList.remove("hidden");
});

toggleToCreate.addEventListener("click", () => {
  formTitle.textContent = "Create Account";
  createBtn.classList.remove("hidden");
  signInNowBtn.classList.add("hidden");
  toggleToSignIn.classList.remove("hidden");
  toggleToCreate.classList.add("hidden");
});

// Monitoring Logic
function startMonitoring(url, interval) {
  const item = document.createElement("div");
  item.className = "monitor-item";
  item.innerHTML = `<span>${url}</span><span class="status checking">Checking...</span>`;
  list.appendChild(item);

  const statusElem = item.querySelector(".status");

  const checkStatus = async () => {
    statusElem.textContent = "Checking...";
    statusElem.className = "status checking";
    try {
      const res = await fetch(`${backendURL}/ping?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (json.success) {
        statusElem.textContent = "Online";
        statusElem.className = "status online";
      } else {
        statusElem.textContent = "Offline";
        statusElem.className = "status offline";
      }
    } catch {
      statusElem.textContent = "Offline";
      statusElem.className = "status offline";
    }
  };

  checkStatus();
  setInterval(checkStatus, interval);
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (localStorage.getItem("loggedIn") !== "true") {
    alert("Please log in to use the monitoring feature.");
    return;
  }

  const url = input.value.trim();
  const interval = parseInt(intervalSelect.value);
  if (!url || isNaN(interval)) return;

  const saved = JSON.parse(localStorage.getItem("monitoredSites") || "[]");
  saved.push({ url, interval });
  localStorage.setItem("monitoredSites", JSON.stringify(saved));

  startMonitoring(url, interval);
  input.value = "";
});

function loadMonitoredSites() {
  list.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem("monitoredSites") || "[]");
  saved.forEach(({ url, interval }) => startMonitoring(url, interval));
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("loggedIn") === "true") {
    loadMonitoredSites();
  }
});
