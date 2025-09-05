// ===== AUTH =====
let users = [];
let currentUser = null;

function toggleAuth(type) {
  document.getElementById("loginBox").style.display = type === "login" ? "block" : "none";
  document.getElementById("signupBox").style.display = type === "signup" ? "block" : "none";
}

function signup() {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!username || !password) return alert("Please fill in all fields");

  if (users.find(u => u.username === username)) return alert("Username already exists!");

  users.push({ username, password });
  alert("Account created! Please login.");
  document.getElementById("signupUsername").value = "";
  document.getElementById("signupPassword").value = "";
  toggleAuth("login");
}

function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return alert("Invalid username or password");

  currentUser = user;
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("mainApp").style.display = "block";

  loadBooks();
  updateStats();
  displayMyListings();
}

function logout() {
  currentUser = null;
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("authContainer").style.display = "flex";
  toggleAuth("login");
}

// ===== BOOK DATA =====
let books = [
  {
    id: 1,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    originalPrice: 500,
    sellingPrice: 200,
    condition: "Good",
    seller: "Mrs. Sharma",
    contact: "+91-9876543210",
    description: "Classic American literature in good condition",
    listedBy: "demo"
  },
  {
    id: 2,
    title: "Introduction to Algorithms",
    author: "Cormen, Leiserson, Rivest",
    category: "Academic",
    originalPrice: 800,
    sellingPrice: 400,
    condition: "Like New",
    seller: "Prof. Kumar",
    contact: "+91-9876543211",
    description: "Comprehensive computer science textbook",
    listedBy: "demo"
  }
];

let currentTab = "browse";
let filteredBooks = [...books];

// ===== Tabs =====
function switchTab(tab) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(tab).classList.add('active');
  event.target.classList.add('active');
  currentTab = tab;

  if (tab === "browse") loadBooks();
  if (tab === "my-listings") displayMyListings();
}

// ===== Display Books =====
function loadBooks() {
  const container = document.getElementById("booksGrid");
  container.innerHTML = "";
  if (!filteredBooks.length) {
    container.innerHTML = `<div class="empty-state"><h3>No books found</h3></div>`;
    return;
  }

  filteredBooks.forEach(book => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <h3>${book.title}</h3>
      <p>Author: ${book.author}</p>
      <p>Category: ${book.category}</p>
      <p class="price">₹${book.sellingPrice}</p>
      <p class="savings">You Save: ₹${book.originalPrice - book.sellingPrice}</p>
      <p>Condition: ${book.condition}</p>
      <div class="contact-info">
        <strong>Seller:</strong> ${book.seller} <br>
        <strong>Contact:</strong> ${book.contact}
      </div>
      <p>${book.description || ""}</p>
    `;
    container.appendChild(card);
  });
}

// ===== Add Book =====
function addBook(e) {
  e.preventDefault();
  const id = Date.now();
  const book = {
    id,
    title: document.getElementById("bookTitle").value.trim(),
    author: document.getElementById("bookAuthor").value.trim(),
    category: document.getElementById("bookCategory").value,
    originalPrice: Number(document.getElementById("originalPrice").value),
    sellingPrice: Number(document.getElementById("sellingPrice").value),
    condition: document.getElementById("bookCondition").value,
    seller: document.getElementById("sellerName").value.trim(),
    contact: document.getElementById("sellerContact").value.trim(),
    description: document.getElementById("bookDescription").value.trim(),
    listedBy: currentUser.username
  };
  books.push(book);
  document.getElementById("sellForm").reset();
  filterBooks();
  updateStats();
  alert("Book listed successfully!");
}

// ===== My Listings =====
function displayMyListings() {
  const container = document.getElementById("myListingsGrid");
  container.innerHTML = "";
  const myBooks = books.filter(b => b.listedBy === currentUser.username);
  if (!myBooks.length) {
    container.innerHTML = `<div class="empty-state"><h3>No listings yet</h3></div>`;
    return;
  }

  myBooks.forEach(book => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <h3>${book.title}</h3>
      <p>Author: ${book.author}</p>
      <p>Category: ${book.category}</p>
      <p class="price">₹${book.sellingPrice}</p>
      <p class="savings">You Save: ₹${book.originalPrice - book.sellingPrice}</p>
      <p>Condition: ${book.condition}</p>
      <div class="contact-info">
        <strong>Seller:</strong> ${book.seller} <br>
        <strong>Contact:</strong> ${book.contact}
      </div>
      <p>${book.description || ""}</p>
      <button class="btn" onclick="removeBook(${book.id})">Remove</button>
    `;
    container.appendChild(card);
  });
}

// ===== Remove Book =====
function removeBook(id) {
  if (!confirm("Are you sure you want to remove this book?")) return;
  books = books.filter(b => b.id !== id);
  filterBooks();
  displayMyListings();
  updateStats();
}

// ===== Filter Books =====
function filterBooks() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const price = document.getElementById("priceFilter").value;

  filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search);
    const matchesCategory = category ? b.category === category : true;
    let matchesPrice = true;

    if (price) {
      const [min, max] = price.split("-");
      if (max) matchesPrice = b.sellingPrice >= Number(min) && b.sellingPrice <= Number(max);
      else matchesPrice = b.sellingPrice >= Number(min);
    }

    return matchesSearch && matchesCategory && matchesPrice;
  });

  loadBooks();
  updateStats();
}

// ===== Stats =====
function updateStats() {
  const totalBooks = books.length;
  const totalSellers = new Set(books.map(b => b.seller)).size;
  const avgPrice = totalBooks ? Math.round(books.reduce((a,b)=>a+b.sellingPrice,0)/totalBooks) : 0;
  const totalSaves = books.reduce((a,b)=>a+(b.originalPrice-b.sellingPrice),0);

  document.getElementById("totalBooks").textContent = totalBooks;
  document.getElementById("totalSellers").textContent = totalSellers;
  document.getElementById("avgPrice").textContent = `₹${avgPrice}`;
  document.getElementById("totalSaves").textContent = `₹${totalSaves}`;
}
