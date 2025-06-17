// DOM Elements
const form = document.getElementById("monitorForm");
const input = document.getElementById("websiteUrl");
const list = document.getElementById("monitoredList");
const intervalSelect = document.getElementById("pingInterval");
const createBtn = document.getElementById("createAccountBtn");
const signInNowBtn = document.getElementById("signInNowBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");
const formTitle = document.getElementById("formTitle");
const toggleToSignIn = document.getElementById("toggleToSignIn");
const toggleToCreate = document.getElementById("toggleToCreate");

const backendURL = "https://pingit-backend.onrender.com";

// Toggle login form popup
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

// Toggle Form Mode
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

// Registration
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
    localStorage.setItem("userEmail", email);
    loadMonitoredSites();
    closeForm();
    checkAuthStatus();
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
    localStorage.setItem("userEmail", email);
    loadMonitoredSites();
    closeForm();
    checkAuthStatus();
  }
});

// Monitor Logic
function startMonitoring(name, url, interval, id) {
  const card = document.createElement("div");
  card.className = "monitor-card";
  card.dataset.id = id;
  card.innerHTML = `
  <div class="monitor-card-content">
    <div class="monitor-preview">
      <iframe src="${url}" loading="lazy"></iframe>
    </div>
    <div class="monitor-details">
      <h3>${name}</h3>
      <p>${url}</p>
      <p>Status: <span class="status checking">Checking...</span></p>
      <button class="delete-btn">Delete</button>
    </div>
  </div>
`;

  const statusSpan = card.querySelector(".status");

  async function checkStatus() {
    statusSpan.textContent = "Checking...";
    statusSpan.className = "status checking";

    try {
      const response = await fetch(`${backendURL}/ping?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data.success) {
        statusSpan.textContent = "Online";
        statusSpan.className = "status online";
      } else {
        statusSpan.textContent = "Offline";
        statusSpan.className = "status offline";
      }
    } catch {
      statusSpan.textContent = "Offline";
      statusSpan.className = "status offline";
    }
  }

  
  const deleteBtn = card.querySelector(".delete-btn");
deleteBtn.addEventListener("click", async () => {
  const confirmation = prompt(`To delete the web monitor permanently, type "${name}" and press delete`);

  if (confirmation !== name) {
    alert("Monitor name did not match. Deletion cancelled.");
    return;
  }

  try {
    const res = await fetch(`${backendURL}/delete-url?id=${encodeURIComponent(card.dataset.id)}`, {
      method: "DELETE"
    });

    const data = await res.json();
    alert(data.message || "URL deleted");

    if (res.ok) {
      card.remove();
    }
  } catch (error) {
    alert("Failed to delete the monitor");
    console.error(error);
  }
});


  list.appendChild(card);
  checkStatus();
  setInterval(checkStatus, interval);
}

// Submit handler
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (localStorage.getItem("loggedIn") !== "true") {
    alert("Please log in to use the monitoring feature.");
    return;
  }

  const email = localStorage.getItem("userEmail");
  const name = document.getElementById("websiteName").value.trim();
  const url = input.value.trim();
  const interval = parseInt(intervalSelect.value);

  if (!name || !url || isNaN(interval)) return;

  try {
    const res = await fetch(`${backendURL}/add-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, url, interval })
    });

    const data = await res.json();
    if (res.ok) {
      startMonitoring(name, url, interval, data.id);
      form.reset();
    } else {
      alert(data.message || "Failed to save URL.");
    }
  } catch (error) {
    alert("Server error");
    console.error(error);
  }
});

// Load stored monitors
async function loadMonitoredSites() {
  list.innerHTML = "";
  const email = localStorage.getItem("userEmail");
  if (!email) return;

  try {
    const res = await fetch(`${backendURL}/get-urls?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (res.ok && Array.isArray(data.urls)) {
      data.urls.forEach(({ name, url, interval, _id }) => startMonitoring(name, url, interval, _id));
    }
  } catch (error) {
    alert("Failed to load monitored sites.");
    console.error(error);
  }
}

// Auth UI toggle
function checkAuthStatus() {
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  if (loginBtn) loginBtn.classList.toggle("hidden", isLoggedIn);
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !isLoggedIn);
}

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");
  list.innerHTML = "";
  alert("Logged out successfully!");
  checkAuthStatus();
});

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("loggedIn") === "true") {
    loadMonitoredSites();
  }
  checkAuthStatus();
});
