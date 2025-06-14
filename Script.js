// ===== 📁 models/User.js =====
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  monitoredUrls: [
    {
      url: String,
      interval: Number,
    },
  ],
});

module.exports = mongoose.model('User', userSchema);


// ===== 📁 routes/routes.js =====
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.status(200).json({ message: "Login successful", userId: user._id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Save monitored URL
router.post("/save-url", async (req, res) => {
  const { userId, url, interval } = req.body;
  if (!userId || !url || !interval) return res.status(400).json({ message: "Missing data" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.monitoredUrls.push({ url, interval });
    await user.save();

    res.status(200).json({ message: "URL saved" });
  } catch (err) {
    console.error("Save URL error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get monitored URLs
router.get("/urls/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.monitoredUrls);
  } catch (err) {
    console.error("Get URLs error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


// ===== 📁 public/Script.js =====
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
const backendURL = "https://pingit-backend.onrender.com";
let loggedInUserId = null;

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

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const url = input.value.trim();
  const interval = parseInt(intervalSelect.value);
  if (!url || isNaN(interval) || !loggedInUserId) return;

  await fetch(`${backendURL}/save-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: loggedInUserId, url, interval })
  });

  addMonitorItem(url, interval);
  input.value = "";
});

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
      statusElem.textContent = json.success ? "Online" : "Offline";
      statusElem.className = `status ${json.success ? "online" : "offline"}`;
    } catch {
      statusElem.textContent = "Offline";
      statusElem.className = "status offline";
    }
  };

  checkStatus();
  setInterval(checkStatus, interval);
}

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
  if (data.userId) {
    loggedInUserId = data.userId;
    alert("Login successful");
    closeForm();
    loadUserUrls();
  } else {
    alert(data.message || "Login failed");
  }
});

async function loadUserUrls() {
  const res = await fetch(`${backendURL}/urls/${loggedInUserId}`);
  const urls = await res.json();
  list.innerHTML = "";
  urls.forEach(({ url, interval }) => addMonitorItem(url, interval));
}

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
