// ---------- ELEMENTS ----------
const loginScreen = document.getElementById("loginScreen");
const container = document.querySelector(".container");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const loginError = document.getElementById("loginError");

const balanceUSDSpan = document.getElementById("balanceUSD");
const balanceEURSpan = document.getElementById("balanceEUR");
const transactionList = document.getElementById("transaction-list");

const depositAmount = document.getElementById("depositAmount");
const depositCurrency = document.getElementById("depositCurrency");

const exchangeAmount = document.getElementById("exchangeAmount");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const exchangeResult = document.getElementById("exchangeResult");

const transferUserInput = document.getElementById("transferUser");
const transferAmountInput = document.getElementById("transferAmount");
const transferCurrency = document.getElementById("transferCurrency");
const transferBtn = document.getElementById("transferBtn");

const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const adminTableBody = document.getElementById("adminTableBody");
const adminLink = document.getElementById("adminLink");
const adminFinanceControls = document.getElementById("adminFinanceControls");

// ---------- ADMIN USER ----------
const adminUsername = "admin";
const adminPassword = "12345";
const adminID = "A00000000";

// ---------- VARIABLES ----------
let currentUser = null;
let currentUserID = null;
let balanceUSD = 0;
let balanceEUR = 0;

// ---------- STORAGE ----------
function getUsers() { return JSON.parse(localStorage.getItem("users")) || {}; }
function saveUsers(users) { localStorage.setItem("users", JSON.stringify(users)); }
function getLastID() { return parseInt(localStorage.getItem("lastID")) || 10000000; }
function saveLastID(id) { localStorage.setItem("lastID", id); }

// ---------- CREATE ADMIN ----------
let users = getUsers();
let lastID = getLastID();

if(users[adminUsername]){
  users[adminUsername].id = adminID;
} else {
  users[adminUsername] = { password: adminPassword, usd:0, eur:0, history:[], banned:false, id:adminID };
}
if(lastID < 10000000) lastID = 10000000;

saveLastID(lastID);
saveUsers(users);

// ---------- AUTO LOGIN ----------
const sessionUser = localStorage.getItem("loggedInUser");
if(sessionUser) loadUser(sessionUser);
else container.style.display = "none";

// ---------- LOAD USER ----------
function loadUser(username){
  const users = getUsers();
  currentUser = username;
  currentUserID = users[username].id;
  balanceUSD = users[username].usd;
  balanceEUR = users[username].eur;

  document.getElementById("welcomeUser").textContent = `${username} Account ID: ${currentUserID}`;
  loginScreen.style.display = "none";
  container.style.display = "block";

  updateBalance();
  loadHistory();

  if(currentUser === adminUsername){
    adminLink.style.display = "block";
    adminFinanceControls.style.display = "block";
    showSection('admin');
    loadAdminDashboard();
  } else {
    adminLink.style.display = "none";
    adminFinanceControls.style.display = "none";
    showSection('home');
  }
}

// ---------- REGISTER ----------
registerBtn.onclick = function(){
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const users = getUsers();

  if(!username || !password){ 
    loginError.style.color="red";
    loginError.textContent="Enter username and password"; 
    return; 
  }
  if(users[username]){ 
    loginError.style.color="red";
    loginError.textContent="User already exists"; 
    return; 
  }

  let lastID = getLastID();
  lastID++;
  if(lastID > 90000000) { loginError.textContent = "Maximum users reached"; return; }
  saveLastID(lastID);
  const userID = "A" + lastID.toString().padStart(8,'0');

  users[username] = {password, usd:0, eur:0, history:[], banned:false, id:userID};
  saveUsers(users);

  loginError.style.color="green";
  loginError.textContent=`Registered successfully! Account ID: ${userID}`;
};

// ---------- LOGIN ----------
loginBtn.onclick = function(){
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const users = getUsers();

  if(!users[username] || users[username].password !== password){
    loginError.style.color="red";
    loginError.textContent="Wrong username or password";
    return;
  }
  if(users[username].banned){
    loginError.style.color="red";
    loginError.textContent="This account has been banned by admin";
    return;
  }

  localStorage.setItem("loggedInUser", username);
  loadUser(username);
};

// ---------- LOGOUT ----------
function logout(){
  localStorage.removeItem("loggedInUser");
  location.reload();
}

// ---------- BALANCE & HISTORY ----------
function updateBalance(){
  balanceUSDSpan.textContent = balanceUSD.toFixed(2);
  balanceEURSpan.textContent = balanceEUR.toFixed(2);

  const users = getUsers();
  users[currentUser].usd = balanceUSD;
  users[currentUser].eur = balanceEUR;
  saveUsers(users);
}

// ---------- ADD TRANSACTION ----------
function addTransaction(text, type="default"){
  const div = document.createElement("div");
  div.className = `transaction-item ${type}`;

  const lines = text.split("\n");
  if(lines.length > 1){
    const timestamp = lines.shift(); // first line is timestamp
    div.setAttribute("data-timestamp", timestamp);
    div.textContent = lines.join("\n");
  } else {
    const timestamp = new Date().toLocaleString();
    div.setAttribute("data-timestamp", timestamp);
    div.textContent = text;
  }

  transactionList.prepend(div);

  const users = getUsers();
  users[currentUser].history.unshift(div.getAttribute("data-timestamp") + "\n" + div.textContent);
  saveUsers(users);
}

// ---------- LOAD HISTORY ----------
function loadHistory(){
  transactionList.innerHTML = "";
  const history = getUsers()[currentUser].history || [];

  history.forEach(entry => {
    const div = document.createElement("div");
    div.className = "transaction-item default";

    if(entry.includes("📤")) div.classList.add("sent");
    else if(entry.includes("📥") || entry.includes("💵")) div.classList.add("received");
    else if(entry.includes("💸")) div.classList.add("sent");

    const lines = entry.split("\n");
    div.setAttribute("data-timestamp", lines[0]);
    div.textContent = lines.slice(1).join("\n");

    transactionList.appendChild(div);
  });
}

// ---------- DEPOSIT ----------
document.getElementById("depositBtn").onclick = function(){
  if(currentUser !== adminUsername) return alert("Only admin can deposit");

  const amt = parseFloat(depositAmount.value);
  const cur = depositCurrency.value.toUpperCase();
  const curKey = cur.toLowerCase();

  if(isNaN(amt) || amt <= 0) return alert("Enter a valid amount");

  if(curKey === "usd") balanceUSD += amt;
  else if(curKey === "eur") balanceEUR += amt;
  else return alert("Unsupported currency");

  addTransaction(`💵 Admin Deposit ${amt} ${cur}`, "received");
  updateBalance();
  depositAmount.value = "";
};

// ---------- WITHDRAW ----------
document.getElementById("withdrawBtn").onclick = function(){
  if(currentUser !== adminUsername) return alert("Only admin can withdraw");

  const amt = parseFloat(depositAmount.value);
  const cur = depositCurrency.value.toUpperCase();
  const curKey = cur.toLowerCase();

  if(isNaN(amt) || amt <= 0) return alert("Enter a valid amount");

  if((curKey === "usd" && balanceUSD >= amt) || (curKey === "eur" && balanceEUR >= amt)){
    if(curKey === "usd") balanceUSD -= amt;
    else if(curKey === "eur") balanceEUR -= amt;
  } else {
    return alert("Not enough balance");
  }

  addTransaction(`💸 Admin Withdrawal ${amt} ${cur}`, "sent");
  updateBalance();
  depositAmount.value = "";
};

// ---------- EXCHANGE ----------
document.getElementById("exchangeBtn").onclick = function(){
  const amt = parseFloat(exchangeAmount.value);
  const from = fromCurrency.value.toUpperCase();
  const to = toCurrency.value.toUpperCase();

  if(from === to) return alert("Select different currencies");
  if(isNaN(amt) || amt <= 0) return alert("Enter a valid amount");

  let rate = 1;
  if(from === "USD" && to === "EUR") rate = 0.9;
  else if(from === "EUR" && to === "USD") rate = 1.1;
  else return alert("Exchange rate not defined");

  if((from === "USD" && balanceUSD >= amt) || (from === "EUR" && balanceEUR >= amt)){
    if(from === "USD") balanceUSD -= amt;
    else if(from === "EUR") balanceEUR -= amt;

    const received = amt * rate;
    if(to === "USD") balanceUSD += received;
    else if(to === "EUR") balanceEUR += received;

    exchangeResult.textContent = `Received ${received.toFixed(2)} ${to}`;
    addTransaction(`🔄 Exchanged ${amt} ${from} to ${received.toFixed(2)} ${to}`, "default");
    updateBalance();
    exchangeAmount.value = "";
  } else {
    return alert("Not enough balance");
  }
};

// ---------- SEND MONEY BY ID ----------
transferBtn.onclick = function() {
  const recipientID = transferUserInput.value.trim();
  const amt = parseFloat(transferAmountInput.value);
  const cur = transferCurrency.value.toUpperCase();
  const users = getUsers();

  if(!recipientID || isNaN(amt) || amt <= 0) 
    return alert("Enter valid transfer details");

  const recipientUser = Object.keys(users).find(u => users[u].id === recipientID);
  if(!recipientUser) return alert("Account ID not found");
  if(recipientUser === currentUser) return alert("Cannot send money to yourself");
  if(users[recipientUser].banned) return alert("Cannot send to a banned user");

  const curKey = cur.toLowerCase();
  const senderBalance = curKey === "usd" ? balanceUSD : balanceEUR;

  if(senderBalance < amt) return alert(`Not enough ${cur}`);

  if(curKey === "usd") balanceUSD -= amt;
  else if(curKey === "eur") balanceEUR -= amt;

  users[recipientUser][curKey] = (users[recipientUser][curKey] || 0) + amt;

  const timestamp = new Date().toLocaleString();

  users[recipientUser].history.unshift(
`${timestamp}
📥 Received
From: ${currentUser} (${currentUserID})
To:   ${recipientUser} (${recipientID})
Amount: ${amt} ${cur}`
  );

  addTransaction(
`${timestamp}
📤 Sent
From: ${currentUser} (${currentUserID})
To: ${recipientUser} (${recipientID})
Amount: ${amt} ${cur}`, "sent"
  );

  saveUsers(users);
  updateBalance();

  transferUserInput.value = "";
  transferAmountInput.value = "";
};

// ---------- CLEAR HISTORY ----------
clearHistoryBtn.onclick = function(){
  transactionList.innerHTML="";
  const users = getUsers();
  users[currentUser].history=[];
  saveUsers(users);
};

// ---------- ADMIN DASHBOARD ----------
function loadAdminDashboard() {
  adminTableBody.innerHTML = "";
  const users = getUsers();
  let totalUSD = 0, totalEUR = 0;

  for (const username in users) {
    const user = users[username];
    totalUSD += user.usd;
    totalEUR += user.eur;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${username}</td>
      <td>${user.id}</td>
      <td>${user.usd.toFixed(2)}</td>
      <td>${user.eur.toFixed(2)}</td>
      <td>${user.banned ? "🚫 Banned" : "Active"}</td>
      <td>
        ${username !== adminUsername ? `
          <button onclick="toggleBan('${username}')">${user.banned ? "Unban" : "Ban"}</button>
          <button onclick="deleteUser('${username}')">Delete</button>
        ` : "Protected"}
      </td>
    `;
    adminTableBody.appendChild(row);
  }

  document.getElementById("systemTotals").innerHTML = `Total USD: $${totalUSD.toFixed(2)} | Total EUR: €${totalEUR.toFixed(2)}`;
}

// ---------- ADMIN FUNCTIONS ----------
function deleteUser(username){
  if(username === adminUsername) return alert("Cannot delete admin!");
  if(!confirm("Delete user " + username + "?")) return;

  const users = getUsers();
  delete users[username];
  saveUsers(users);
  loadAdminDashboard();
}

function toggleBan(username){
  const users = getUsers();
  users[username].banned = !users[username].banned;
  saveUsers(users);
  loadAdminDashboard();
}

// ---------- NAVIGATION ----------
function showSection(id){
  document.querySelectorAll(".content-section").forEach(s=>s.style.display="none");
  document.getElementById(id.toLowerCase()).style.display="block";
}
