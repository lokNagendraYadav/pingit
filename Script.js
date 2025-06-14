// DOM references
const form = document.getElementById("monitorForm");
const input = document.getElementById("websiteUrl");
const list = document.getElementById("monitoredList");
const intervalSelect = document.getElementById("pingInterval");
const createBtn = document.getElementById("createAccountBtn");
const signInNowBtn = document.getElementById("signInNowBtn");
const backendURL = "https://pingit-backend.onrender.com";

let intervalMap = {}; // store intervals per item

function addMonitorItem(url, interval) {
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
  intervalMap[url] = setInterval(checkStatus, interval);
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const url = input.value.trim();
  const interval = parseInt(intervalSelect.value);
  const email = localStorage.getItem("email");

  if (!url || isNaN(interval) || !email) return;

  addMonitorItem(url, interval);

  const currentUrls = Array.from(list.querySelectorAll(".monitor-item > span:first-child")).map(span => span.textContent);
  await fetch(`${backendURL}/save-urls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, urls: currentUrls }),
  });

  input.value = "";
});

// login logic
createBtn.addEventListener("click", async () => {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  const res = await fetch(`${backendURL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  alert(data.message || "Account created");
});

signInNowBtn.addEventListener("click", async () => {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  const res = await fetch(`${backendURL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  alert(data.message || "Logged in");

  if (res.ok && data.email) {
    localStorage.setItem("email", data.email);
    closeForm();
    loadMonitoredUrls();
  }
});

// load monitored URLs
async function loadMonitoredUrls() {
  const email = localStorage.getItem("email");
  if (!email) return;

  const res = await fetch(`${backendURL}/get-urls?email=${encodeURIComponent(email)}`);
  const data = await res.json();

  if (res.ok && Array.isArray(data.urls)) {
    data.urls.forEach(url => addMonitorItem(url, parseInt(intervalSelect.value)));
  }
}

// auto-load on refresh if logged in
window.addEventListener("load", () => {
  if (localStorage.getItem("email")) {
    loadMonitoredUrls();
  }
});

// LOGIN POPUP LOGIC
const loginBtn = document.getElementById("loginBtn");
const loginForm = document.getElementById("loginForm");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");

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

// toggle logic
const formTitle = document.getElementById("formTitle");
const toggleToSignIn = document.getElementById("toggleToSignIn");
const toggleToCreate = document.getElementById("toggleToCreate");

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
