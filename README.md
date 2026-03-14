# Library Automation Demo Site - Knowledge Transfer (KT)

This project is a sandbox for learning UI automation (Selenium, Playwright, Cypress). It features iframe switching, native browser dialogs (alerts and confirms), local storage data persistence, and cross-window interactions.

Below is the expected behavior and locator information for all interactable form fields across the application to help you write your automated tests.

## 1. Login Page (`/index.html`)

| Field Name | Locator (`data-testid`) | Interactive Type | Validations & Expected Values |
| :--- | :--- | :--- | :--- |
| **Email Address** | `login-email` | `<input type="email">` | **Required.** Must be a valid email format. <br> *Default Test Data:* `admin@library.com` |
| **Password** | `login-password` | `<input type="password">` | **Required.** Minimum length: 5 characters. <br> *Default Test Data:* `password` |
| **Login Button** | `login-submit` | `<button type="submit">` | Submits the form. On failure, triggers a **native `alert()`**. On success, redirects to `/admin.html`. |

---

## 2. Admin Dashboard (`/admin.html` & `/user-detail.html`)

### Add / Edit User Form

| Field Name | Locator (`data-testid`) | Interactive Type | Validations & Expected Values |
| :--- | :--- | :--- | :--- |
| **Full Name** | `user-name` | `<input type="text">` | **Required.** Min: 2, Max: 80 chars. Letters and spaces only. Pattern: `^[a-zA-Z\s]+$` |
| **Email Address** | `user-email` | `<input type="email">` | **Required.** Must be a valid and **unique** email address. |
| **Password** | `user-password` | `<input type="password">` | **Required.** Minimum length: 5 characters. |
| **Role: Admin** | `role-admin` | `<input type="radio">` | Selects the `admin` role. **Default selected.** |
| **Role: Editor** | `role-editor` | `<input type="radio">` | Selects the `editor` role. |
| **Role: Viewer** | `role-viewer` | `<input type="radio">` | Selects the `viewer` role. |
| **Submit Button** | `user-submit` | `<button type="submit">` | Saves user. Triggers a **native `alert()`** on success. Shows duplicate email alert if email already exists. |
| **Cancel Button** | `user-cancel` | `<button type="button">` | Only visible when editing. Resets the form back to Add state. |

### Users Data Table

| Element Name | Locator (`data-testid`) | Interaction Type | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **View Button** | `view-user-{id}` | `<button>` (Dynamic) | Loads the user's details into the embedded iframe below. |
| **Edit Button** | `edit-user-{id}` | `<button>` (Dynamic) | Populates the *Add/Edit User Form* with the selected user's data. |
| **Delete Button** | `delete-user-{id}` | `<button>` (Dynamic) | Triggers a **native `confirm()`** dialog. Cannot delete currently logged-in account (shows `alert()`). |

### User Detail IFrame

| Element Name | Locator (`data-testid`) | Interaction Type | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **User Iframe** | `user-iframe` | `<iframe>` element | Automation scripts must **switch context** into this iframe to read the fields below. |
| **Iframe UI: ID** | `iframe-user-id` | `<div>` text | Displays the ID of the viewed user. |
| **Iframe UI: Email** | `iframe-user-email` | `<div>` text | Displays the Email of the viewed user. |
| **Iframe UI: Role** | `iframe-user-role` | `<div>` text | Displays the Role (e.g., admin, editor) of the viewed user. |

---

## 3. Books Management (`/books.html`)

### Add / Edit Book Form

| Field Name | Locator (`data-testid`) | Interactive Type | Validations & Expected Values |
| :--- | :--- | :--- | :--- |
| **Title** | `book-title` | `<input type="text">` | **Required.** Minimum length: 2, Maximum length: 100. |
| **Author** | `book-author` | `<input type="text">` | **Required.** Minimum length: 2, Maximum length: 100. <br> *Regex Pattern:* `^[a-zA-Z\s\.]+$` (Letters, spaces, and periods only). |
| **Genre** | `book-genre` | `<select>` | **Required.** Must select one of the dropdown options (Fiction, Non-Fiction, Science, Fantasy, Dystopian, Romance). |
| **Published Date** | `book-published` | `<input type="date">` | **Required.** Must be a valid calendar date between `1000-01-01` and `2099-12-31`. |
| **Submit Button** | `book-submit` | `<button type="submit">` | Saves the book to LocalStorage. Triggers a **native `alert()`** on success. |
| **Cancel Button** | `book-cancel` | `<button type="button">` | Only visible when editing an existing book. Resets the form to "Add Book" state. |

### Books Data Table

| Element Name | Locator (`data-testid`) | Interaction Type | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **Book Link** | `book-link-{id}` | `<a>` hyperlink | Clicking this link has `target="_blank"` and opens `/book-detail.html?id={id}` in a **new browser window**. |
| **Edit Button** | `edit-book-{id}` | `<button>` (Dynamic) | Populates the *Add/Edit Book Form* with the selected book's data. |
| **Remove Button** | `remove-book-{id}`| `<button>` (Dynamic) | Triggers a **native `confirm()`** dialog. Accepting the confirm dialogue will remove the row from the table. |

---

## 4. Book Details Window (`/book-detail.html`)

*Note: This page is designed to test your automation tool's ability to switch to newly spawned browser windows.*

| Element Name | Locator (`data-testid`) | Interaction Type | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **Internal ID** | `window-book-id` | `<div>` text | Displays the Book's ID. |
| **Title** | `window-book-title` | `<div>` text | Displays the Book's Title. |
| **Close Window** | `window-close-btn` | `<button>` | Calls `window.close()` to kill the current tab/window. Your test script should switch context back to the primary window after this. |

---

## Global Elements

| Element Name | Locator (`data-testid`) | Interaction Type | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **Reset Data**| `global-reset-btn` | Floating `<button>` | Triggers a **native `confirm()`**. Accepting it will erase `localStorage`, re-seed default data, and refresh the DOM. Useful in test teardown hooks. |
| **Logout** | `nav-logout` | `<a>` hyperlink in Header | Clears the session storage and redirects back to `/index.html`. |
