// Insert toast container into the DOM if not present
if (!document.getElementById("toastContainer")) {
  const toastContainer = document.createElement("div");
  toastContainer.id = "toastContainer";
  toastContainer.className = "toast-container";
  document.body.appendChild(toastContainer);
}

// Show toast messages
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.getElementById("toastContainer").appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

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
  showToast(data.message || "Account created", res.ok ? "success" : "error");

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
  showToast(data.message || "Logged in", res.ok ? "success" : "error");

  if (res.ok) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);
    loadMonitoredSites();
    closeForm();
    checkAuthStatus();
  }
});
//moniter
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
  deleteBtn.addEventListener("click", () => {
    const modal = document.getElementById("deleteModal");
    const confirmInput = document.getElementById("confirmNameInput");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const cancelBtn = document.getElementById("cancelDeleteBtn");

    confirmInput.value = "";
    document.getElementById("monitorNameHighlight").textContent = `"${name}"`;
    modal.classList.remove("hidden");

    function cleanup() {
      modal.classList.add("hidden");
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
    }

    function onConfirm() {
      if (confirmInput.value.trim() !== name) {
        showToast("Monitor name did not match. Deletion cancelled.", "error");
        cleanup();
        return;
      }

      fetch(`${backendURL}/delete-url?id=${encodeURIComponent(card.dataset.id)}`, {
        method: "DELETE"
      })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          showToast(data.message || "URL deleted", ok ? "success" : "error");
          if (ok) card.remove();
          cleanup();
        })
        .catch(error => {
          showToast("Failed to delete the monitor", "error");
          console.error(error);
          cleanup();
        });
    }

    function onCancel() {
      cleanup();
    }

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  });

  list.appendChild(card);
  checkStatus();
  setInterval(checkStatus, interval);
}

// Submit handler
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (localStorage.getItem("loggedIn") !== "true") {
    showToast("Please log in to use the monitoring feature.", "error");
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
      showToast("Monitoring started!", "success");
    } else {
      showToast(data.message || "Failed to save URL.", "error");
    }
  } catch (error) {
    showToast("Server error", "error");
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
    showToast("Failed to load monitored sites.", "error");
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
  showToast("Logged out successfully!", "info");
  checkAuthStatus();
});

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("loggedIn") === "true") {
    loadMonitoredSites();
  }
  checkAuthStatus();
});

// Intro animation
window.addEventListener("load", () => {
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if (intro) {
      intro.style.display = "none";
    }
  }, 2600);
});

// Navbar animation
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("loginBtn").classList.add("slide-down");
  }, 2500);
});

// Toolbar hover animation
const icons = document.querySelectorAll('.tool-icon img');
const sensitivity = 400;

document.addEventListener('mousemove', (e) => {
  icons.forEach(icon => {
    const rect = icon.getBoundingClientRect();
    const iconX = rect.left + rect.width / 2;
    const iconY = rect.top + rect.height / 2;
    const dx = e.clientX - iconX;
    const dy = e.clientY - iconY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = Math.max(1, 1.5 - distance / sensitivity);
    icon.style.transform = `scale(${scale})`;
  });
});

// Adjust contact section height
function adjustContactHeight() {
  const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
  const mboxHeight = document.querySelector('.mbox')?.offsetHeight || 0;
  const windowHeight = window.innerHeight;
  const contact = document.querySelector('.contact-section');
  const availableHeight = windowHeight - navHeight - mboxHeight;

  if (contact) {
    contact.style.minHeight = `${availableHeight}px`;
    contact.style.display = 'flex';
    contact.style.flexDirection = 'column';
    contact.style.justifyContent = 'center';
  }
}

window.addEventListener('load', adjustContactHeight);
window.addEventListener('resize', adjustContactHeight);

// Contact form submission
document.querySelector('.contact-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;

  const data = {
    name: form.name.value,
    phone: form.phone.value,
    email: form.email.value,
    message: form.message.value
  };

  try {
    const response = await fetch('https://contact-backend-br8j.onrender.com/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showToast('Message sent successfully!', 'success');
      form.reset();
    } else {
      showToast('Error sending message.', 'error');
    }
  } catch (error) {
    showToast('Server error: ' + error.message, 'error');
  }
});
