// DOM references
const form = document.getElementById("monitorForm");
const input = document.getElementById("websiteUrl");
const list = document.getElementById("monitoredList");
const intervalSelect = document.getElementById("pingInterval");

// LOGIN POPUP LOGIC
const loginBtn = document.getElementById("loginBtn");
const loginForm = document.getElementById("loginForm");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");

function openForm() {
  overlay.classList.remove("hidden");
  loginForm.classList.remove("hidden");
  loginForm.offsetWidth; // trigger reflow
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

// MAIN LOGIC – Real-Time Pinging
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const url = input.value.trim();
  const interval = parseInt(intervalSelect.value);

  if (!url || isNaN(interval)) return;

  const item = document.createElement("div");
  item.className = "monitor-item";
  item.innerHTML = `<span>${url}</span><span class="status checking">Checking...</span>`;
  list.appendChild(item);

  const statusElem = item.querySelector(".status");

  const checkStatus = async () => {
    statusElem.textContent = "Checking...";
    statusElem.className = "status checking";

    try {
      const res = await fetch(`https://your-backend.vercel.app/ping?url=${encodeURIComponent(url)}`);
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

  checkStatus(); // run immediately
  setInterval(checkStatus, interval); // repeat based on user selection

  input.value = "";
});
