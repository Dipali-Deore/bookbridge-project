// ===== Global Variables =====
// Load users from localStorage if present
let users = JSON.parse(localStorage.getItem('bb_users') || '[]');
let currentUser = JSON.parse(localStorage.getItem('bb_currentUser') || 'null');

// Sample books (kept word-for-word from original). We'll persist to localStorage.
let books = JSON.parse(localStorage.getItem('bb_books') || 'null');
if (!books) {
  books = [
    {
      id: 1,
      title: "Engineering Mathematics",
      author: "B.S. Grewal",
      category: "Engineering",
      originalPrice: 650,
      sellingPrice: 350,
      condition: "Good",
      seller: "Rahul Sharma",
      contact: "+91-9876543210",
      college: "IIT Delhi",
      description: "Well-maintained book with minimal highlighting. All pages intact.",
      image: "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='200' fill='%234a90e2'/%3E%3Ctext x='100' y='110' font-family='Arial' font-size='16' fill='white' text-anchor='middle'%3EMath Book%3C/text%3E%3C/svg%3E",
      listedBy: "demo",
      dateAdded: new Date().toISOString()
    },
    {
      id: 2,
      title: "Organic Chemistry",
      author: "Morrison & Boyd",
      category: "Science",
      originalPrice: 850,
      sellingPrice: 450,
      condition: "Like New",
      seller: "Priya Patel",
      contact: "+91-9876543211",
      college: "Mumbai University",
      description: "Excellent condition, used for one semester only.",
      image: "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='200' fill='%2350c878'/%3E%3Ctext x='100' y='110' font-family='Arial' font-size='16' fill='white' text-anchor='middle'%3EChemistry%3C/text%3E%3C/svg%3E",
      listedBy: "demo",
      dateAdded: new Date().toISOString()
    },
    {
      id: 3,
      title: "Data Structures and Algorithms",
      author: "Cormen, Leiserson, Rivest",
      category: "Computer Science",
      originalPrice: 800,
      sellingPrice: 400,
      condition: "Good",
      seller: "Amit Kumar",
      contact: "+91-9876543212",
      college: "NIT Warangal",
      description: "Classic CS textbook. Some notes in margins but overall great condition.",
      image: "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='200' fill='%23f39c12'/%3E%3Ctext x='100' y='110' font-family='Arial' font-size='16' fill='white' text-anchor='middle'%3EAlgorithms%3C/text%3E%3C/svg%3E",
      listedBy: "demo",
      dateAdded: new Date().toISOString()
    }
  ];
  localStorage.setItem('bb_books', JSON.stringify(books));
}

let filteredBooks = [...books];
let wishlist = JSON.parse(localStorage.getItem('bb_wishlist') || '[]');
let cart = JSON.parse(localStorage.getItem('bb_cart') || '[]');
let currentSection = 'home';
let nextBookId = Math.max(...books.map(b => b.id)) + 1;

// ===== Authentication =====
function toggleAuth(type) {
  document.getElementById("loginBox").style.display = type === "login" ? "block" : "none";
  document.getElementById("signupBox").style.display = type === "signup" ? "block" : "none";
}

function signup() {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!username || !password) return alert("Please fill in all fields");
  if (users.find(u => u.username === username)) return alert("Username already exists!");

  users.push({ username, password, joinDate: new Date().toISOString() });
  localStorage.setItem('bb_users', JSON.stringify(users));
  alert("Account created successfully! Please login.");
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
  localStorage.setItem('bb_currentUser', JSON.stringify(currentUser));
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("mainApp").style.display = "block";
  // ensure badges and data reflect persisted state
  renderAll();
  switchSection('home');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('bb_currentUser');
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("authContainer").style.display = "flex";
  switchSection('home'); // reset visible section
}

// If there is a logged-in user from last session, auto-show app
(function initAuthUI() {
  if (currentUser) {
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
  } else {
    document.getElementById("authContainer").style.display = "flex";
    document.getElementById("mainApp").style.display = "none";
  }
})();

// ===== Navigation / Sections =====
function switchSection(sectionId) {
  // update nav-link active class
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  // find nav link containing that onclick (simple matching)
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(sectionId)) {
      link.classList.add('active');
    }
  });

  // hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  // show requested
  const el = document.getElementById(sectionId);
  if (el) {
    el.classList.add('active');
    currentSection = sectionId;
    // if browsing, ensure filter uses current filter values
    if (sectionId === 'browse') filterBooks();
    if (sectionId === 'my-listings') renderMyListings();
  }
}

// ===== Image Preview =====
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('imagePreview');
    img.src = e.target.result;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ===== Add Book =====
function addBook(e) {
  e.preventDefault();
  const title = document.getElementById('bookTitle').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  const category = document.getElementById('bookCategory').value;
  const originalPrice = Number(document.getElementById('originalPrice').value);
  const sellingPrice = Number(document.getElementById('sellingPrice').value);
  const condition = document.getElementById('bookCondition').value;
  const seller = document.getElementById('sellerName').value.trim();
  const contact = document.getElementById('sellerContact').value.trim();
  const college = document.getElementById('sellerCollege').value.trim();
  const description = document.getElementById('bookDescription').value.trim();
  const imgEl = document.getElementById('imagePreview');

  if (!currentUser) return alert('Please login to list a book.');
  if (!title || !author || !category || !originalPrice || !sellingPrice || !condition || !seller || !contact) {
    return alert('Please fill all required fields.');
  }

  const image = imgEl && imgEl.src ? imgEl.src : "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='200' fill='%23cccccc'/%3E%3Ctext x='100' y='110' font-family='Arial' font-size='14' fill='white' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

  const newBook = {
    id: nextBookId++,
    title,
    author,
    category,
    originalPrice,
    sellingPrice,
    condition,
    seller,
    contact,
    college,
    description,
    image,
    listedBy: currentUser.username,
    dateAdded: new Date().toISOString()
  };

  books.unshift(newBook); // show newest first
  localStorage.setItem('bb_books', JSON.stringify(books));

  // reset form
  document.getElementById('sellForm').reset();
  document.getElementById('imagePreview').style.display = 'none';
  alert('Book listed successfully!');
  renderAll();
  switchSection('browse');
}

// ===== Render / Filter Books =====
function renderBooks(list) {
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = '';
  if (!list || list.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>No books found.</h3></div>';
    return;
  }
  list.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';

    card.innerHTML = `
      <div class="book-image">
        <img src="${book.image}" alt="${escapeHtml(book.title)}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div class="book-content">
        <h3>${escapeHtml(book.title)}</h3>
        <p><strong>Author:</strong> ${escapeHtml(book.author)}</p>
        <p><strong>Category:</strong> ${escapeHtml(book.category)}</p>
        <p class="price">₹${Number(book.sellingPrice).toFixed(0)} <span class="original-price">₹${Number(book.originalPrice).toFixed(0)}</span></p>
        <p class="savings">You save ₹${(Number(book.originalPrice) - Number(book.sellingPrice)).toFixed(0)}</p>
        <div class="book-actions">
          <button class="btn" onclick="contactSeller(${book.id})"><i class="fas fa-phone"></i> Contact</button>
          <button class="btn" onclick="viewDetails(${book.id})"><i class="fas fa-info-circle"></i> Details</button>
        </div>
        <div class="contact-info" style="display:none;" id="contact-${book.id}">
          <strong>Seller:</strong> ${escapeHtml(book.seller)}<br>
          <strong>Contact:</strong> ${escapeHtml(book.contact)}<br>
          ${book.college ? `<strong>College:</strong> ${escapeHtml(book.college)}<br>` : ''}
          <p style="margin-top:8px;">${escapeHtml(book.description)}</p>
        </div>
      </div>
    `;

    // wishlist button
    const wishBtn = document.createElement('button');
    wishBtn.className = 'wishlist-btn';
    wishBtn.title = 'Add to wishlist';
    wishBtn.innerHTML = '<i class="fas fa-heart"></i>';
    wishBtn.onclick = () => toggleWishlist(book.id);
    if (wishlist.find(b => b.id === book.id)) wishBtn.classList.add('active');

    // cart button
    const cartBtn = document.createElement('button');
    cartBtn.className = 'cart-btn';
    cartBtn.title = 'Add to cart';
    cartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i>';
    cartBtn.onclick = () => toggleCart(book.id);

    card.appendChild(wishBtn);
    card.appendChild(cartBtn);

    grid.appendChild(card);
  });
}

function filterBooks() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const cat = document.getElementById('categoryFilter').value;
  const price = document.getElementById('priceFilter').value;

  filteredBooks = books.filter(b => {
    let matchesQ = true;
    if (q) {
      matchesQ = (b.title + ' ' + b.author).toLowerCase().includes(q);
    }
    let matchesCat = true;
    if (cat) matchesCat = b.category === cat;

    let matchesPrice = true;
    if (price) {
      if (price === '500+') {
        matchesPrice = b.sellingPrice > 500;
      } else {
        const [min, max] = price.split('-').map(Number);
        matchesPrice = b.sellingPrice >= min && b.sellingPrice <= max;
      }
    }

    return matchesQ && matchesCat && matchesPrice;
  });

  renderBooks(filteredBooks);
}

// ===== Wishlist =====
function toggleWishlist(bookId) {
  const idx = wishlist.findIndex(b => b.id === bookId);
  if (idx === -1) {
    const book = books.find(b => b.id === bookId);
    if (book) wishlist.push(book);
  } else {
    wishlist.splice(idx,1);
  }
  localStorage.setItem('bb_wishlist', JSON.stringify(wishlist));
  renderWishlist();
  renderBooks(filteredBooks);
  updateBadges();
}

function renderWishlist() {
  const container = document.getElementById('wishlistContent');
  container.innerHTML = '';
  if (wishlist.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>Your wishlist is empty.</h3></div>';
    return;
  }
  wishlist.forEach(b => {
    const item = document.createElement('div');
    item.className = 'wishlist-item';
    item.innerHTML = `
      <img src="${b.image}" alt="${escapeHtml(b.title)}">
      <div class="item-details">
        <strong>${escapeHtml(b.title)}</strong><br>
        ${escapeHtml(b.author)}<br>
        <span style="color:#ffd700;">₹${Number(b.sellingPrice).toFixed(0)}</span>
      </div>
      <div class="item-actions">
        <button class="btn" onclick="toggleWishlist(${b.id})">Remove</button>
        <button class="btn" onclick="toggleCart(${b.id})">Add to Cart</button>
      </div>
    `;
    container.appendChild(item);
  });
}

// ===== Cart =====
function toggleCart(bookId) {
  const idx = cart.findIndex(b => b.id === bookId);
  if (idx === -1) {
    const book = books.find(b => b.id === bookId);
    if (book) cart.push(book);
  } else {
    cart.splice(idx,1);
  }
  localStorage.setItem('bb_cart', JSON.stringify(cart));
  renderCart();
  renderBooks(filteredBooks);
  updateBadges();
}

function renderCart() {
  const container = document.getElementById('cartContent');
  container.innerHTML = '';
  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>Your cart is empty.</h3></div>';
    document.getElementById('cartTotal').style.display = 'none';
    document.getElementById('totalAmount').textContent = '0';
    return;
  }
  let total = 0;
  cart.forEach(b => {
    total += Number(b.sellingPrice);
    const item = document.createElement('div');
    item.className = 'cart-item';
    item.innerHTML = `
      <img src="${b.image}" alt="${escapeHtml(b.title)}">
      <div class="item-details">
        <strong>${escapeHtml(b.title)}</strong><br>
        ${escapeHtml(b.author)}<br>
        <span style="color:#ffd700;">₹${Number(b.sellingPrice).toFixed(0)}</span>
      </div>
      <div class="item-actions">
        <button class="btn" onclick="toggleCart(${b.id})">Remove</button>
        <button class="btn" onclick="contactSeller(${b.id})">Contact Seller</button>
      </div>
    `;
    container.appendChild(item);
  });
  document.getElementById('totalAmount').textContent = total.toFixed(0);
  document.getElementById('cartTotal').style.display = 'block';
}

// ===== My Listings =====
function renderMyListings() {
  const user = currentUser ? currentUser.username : null;
  const grid = document.getElementById('myListingsGrid');
  grid.innerHTML = '';
  const my = books.filter(b => b.listedBy === user);
  if (my.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>You have not listed any books yet.</h3></div>';
    return;
  }
  my.forEach(b => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <div class="book-image">
        <img src="${b.image}" alt="${escapeHtml(b.title)}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div class="book-content">
        <h3>${escapeHtml(b.title)}</h3>
        <p><strong>Author:</strong> ${escapeHtml(b.author)}</p>
        <p class="price">₹${Number(b.sellingPrice).toFixed(0)}</p>
        <div style="margin-top:10px;">
          <button class="btn" onclick="removeListing(${b.id})">Remove</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function removeListing(bookId) {
  if (!confirm('Remove this listing?')) return;
  books = books.filter(b => b.id !== bookId);
  // also remove from wishlist/cart if present
  wishlist = wishlist.filter(b => b.id !== bookId);
  cart = cart.filter(b => b.id !== bookId);
  localStorage.setItem('bb_books', JSON.stringify(books));
  localStorage.setItem('bb_wishlist', JSON.stringify(wishlist));
  localStorage.setItem('bb_cart', JSON.stringify(cart));
  renderAll();
  alert('Listing removed.');
}

// ===== Contact / Details =====
function contactSeller(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  alert(`Contact ${book.seller} at ${book.contact}`);
}

function viewDetails(bookId) {
  const el = document.getElementById(`contact-${bookId}`);
  if (!el) return;
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// ===== Stats & Badges =====
function updateStats() {
  document.getElementById('totalBooks').textContent = books.length;
  const sellers = Array.from(new Set(books.map(b => b.seller)));
  document.getElementById('totalSellers').textContent = sellers.length;
  if (books.length === 0) {
    document.getElementById('avgPrice').textContent = '₹0';
    document.getElementById('totalSaves').textContent = '₹0';
  } else {
    const avg = Math.round(books.reduce((s, b) => s + Number(b.sellingPrice), 0) / books.length);
    document.getElementById('avgPrice').textContent = '₹' + avg;
    const saves = books.reduce((s, b) => s + (Number(b.originalPrice) - Number(b.sellingPrice)), 0);
    document.getElementById('totalSaves').textContent = '₹' + saves.toFixed(0);
  }
}

function updateBadges() {
  document.getElementById('wishlistBadge').textContent = wishlist.length;
  document.getElementById('cartBadge').textContent = cart.length;
}

// ===== Utility / Render All =====
function renderAll() {
  filterBooks(); // will call renderBooks with filteredBooks
  renderWishlist();
  renderCart();
  renderMyListings();
  updateStats();
  updateBadges();
}

function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// initial render when page loads
document.addEventListener('DOMContentLoaded', () => {
  // If user logged in from previous session, show main app, else auth screen shows
  if (currentUser) {
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
  } else {
    document.getElementById("authContainer").style.display = "flex";
    document.getElementById("mainApp").style.display = "none";
  }
  renderAll();
});

// keep localStorage updated periodically (safe persistence)
window.addEventListener('beforeunload', () => {
  localStorage.setItem('bb_users', JSON.stringify(users));
  localStorage.setItem('bb_books', JSON.stringify(books));
  localStorage.setItem('bb_wishlist', JSON.stringify(wishlist));
  localStorage.setItem('bb_cart', JSON.stringify(cart));
  localStorage.setItem('bb_currentUser', JSON.stringify(currentUser));
});