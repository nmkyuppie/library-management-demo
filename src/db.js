const INITIAL_USERS = [
  { id: 1, email: 'admin@library.com', password: 'password', name: 'Super Admin', role: 'admin', photo: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 2, email: 'john@library.com', password: 'password', name: 'John Doe', role: 'editor', photo: 'https://randomuser.me/api/portraits/men/44.jpg' },
  { id: 3, email: 'jane@library.com', password: 'password', name: 'Jane Smith', role: 'viewer', photo: 'https://randomuser.me/api/portraits/women/44.jpg' }
];

const INITIAL_BOOKS = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', published: '1925-04-10', genre: 'Fiction', tags: ['Featured', 'Classic'] },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', published: '1960-07-11', genre: 'Fiction', tags: ['Award Winner'] },
  { id: 3, title: '1984', author: 'George Orwell', published: '1949-06-08', genre: 'Dystopian', tags: ['Featured', 'New Arrival'] },
  { id: 4, title: 'Pride and Prejudice', author: 'Jane Austen', published: '1813-01-28', genre: 'Romance', tags: ['Classic'] },
  { id: 5, title: 'The Hobbit', author: 'J.R.R. Tolkien', published: '1937-09-21', genre: 'Fantasy', tags: ['Featured'] }
];

export function initDB() {
  if (!localStorage.getItem('library_users')) {
    localStorage.setItem('library_users', JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem('library_books')) {
    localStorage.setItem('library_books', JSON.stringify(INITIAL_BOOKS));
  }
}

export function resetDB() {
  localStorage.removeItem('library_users');
  localStorage.removeItem('library_books');
  localStorage.removeItem('library_book_notes');
  initDB();
  window.location.reload();
}

// ── Users ──────────────────────────────────────────
export function getUsers() {
  return JSON.parse(localStorage.getItem('library_users') || '[]');
}

export function getUserById(id) {
  return getUsers().find(u => u.id === parseInt(id));
}

export function saveUsers(users) {
  localStorage.setItem('library_users', JSON.stringify(users));
}

export function addUser(user) {
  const users = getUsers();
  const maxId = users.reduce((max, u) => Math.max(max, u.id), 0);
  const newUser = { id: maxId + 1, ...user };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(updatedUser) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === parseInt(updatedUser.id));
  if (index !== -1) {
    users[index] = { ...users[index], ...updatedUser };
    saveUsers(users);
    return true;
  }
  return false;
}

export function deleteUser(id) {
  let users = getUsers();
  const before = users.length;
  users = users.filter(u => u.id !== parseInt(id));
  if (users.length < before) { saveUsers(users); return true; }
  return false;
}

export function login(email, password) {
  return getUsers().find(u => u.email === email && u.password === password) || null;
}

// ── Books ──────────────────────────────────────────
export function getBooks() {
  return JSON.parse(localStorage.getItem('library_books') || '[]');
}

export function getBookById(id) {
  return getBooks().find(b => b.id === parseInt(id));
}

export function saveBooks(books) {
  localStorage.setItem('library_books', JSON.stringify(books));
}

export function addBook(book) {
  const books = getBooks();
  const maxId = books.reduce((max, b) => Math.max(max, b.id), 0);
  const newBook = { id: maxId + 1, ...book };
  books.push(newBook);
  saveBooks(books);
  return newBook;
}

export function updateBook(updatedBook) {
  const books = getBooks();
  const index = books.findIndex(b => b.id === parseInt(updatedBook.id));
  if (index !== -1) {
    books[index] = { ...books[index], ...updatedBook };
    saveBooks(books);
    return true;
  }
  return false;
}

export function deleteBook(id) {
  let books = getBooks();
  const before = books.length;
  books = books.filter(b => b.id !== parseInt(id));
  if (books.length < before) { saveBooks(books); return true; }
  return false;
}

// ── Book Notes (for Tabs feature) ──────────────────
export function getBookNote(bookId) {
  const notes = JSON.parse(localStorage.getItem('library_book_notes') || '{}');
  return notes[parseInt(bookId)] || '';
}

export function saveBookNote(bookId, note) {
  const notes = JSON.parse(localStorage.getItem('library_book_notes') || '{}');
  notes[parseInt(bookId)] = note;
  localStorage.setItem('library_book_notes', JSON.stringify(notes));
}
