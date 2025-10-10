# Admin Module Implementation TODO

## 1. Create Folder Structure

- [x] Create views/admin/
- [x] Create controllers/admin/
- [x] Create models/admin/
- [x] Create public/js/admin/
- [x] Create routes/adminRoutes.js (empty for now)

## 2. Create Admin Model

- [x] Create models/admin/Admin.js with fields: name, email, password (hashed), role, permissions (array), lastLogin.

## 3. Create Admin Controllers

- [x] Create controllers/admin/adminController.js with functions for:
  - Admin login/register (similar to user auth).
  - Dashboard: Fetch stats (total users, pending KYC, active loans, verified users).
  - Users: List all users, view single user, delete user, update balance (add/decrease).
  - KYC: List pending KYC, view details, approve/decline.
  - Loans: List all loans, view details.

## 4. Create Admin Routes

- [x] Create routes/adminRoutes.js for all admin endpoints, prefixed with /admin/.

## 5. Create EJS Views

- [x] Create views/admin/auth/login.ejs and auth/signup.ejs (styled like user login/signup).
- [x] Create views/admin/dashboard.ejs: Stats cards, responsive grid.
- [x] Create views/admin/users.ejs: Table of users with actions.
- [x] Create views/admin/user-details.ejs: User info with buttons for actions.
- [x] Create views/admin/kyc.ejs: Table of pending KYC.
- [x] Create views/admin/kyc-details.ejs: KYC documents and approve/decline buttons.
- [x] Create views/admin/loans.ejs: Table of loans.
- [x] Create views/admin/loan-details.ejs: Loan info.
- [x] Create partials/header.ejs, sidebar.ejs, footer.ejs for consistent layout in views/admin/partials/.

## 6. Create Admin JS Files

- [x] Create public/js/admin/table-interactivity.js for table sorting/pagination.
- [x] Create public/js/admin/modals-animations.js for modals and animations.
- [x] Create public/js/admin/ajax-actions.js for AJAX requests (approve/decline KYC, etc.).

## 7. Update Server.js

- [x] Add mounting of admin routes in server.js.

## 8. Integration and Testing

- [x] Use existing KYC and Loans models; add mock data if needed.
- [x] Test admin login and navigation.
- [x] Verify responsiveness and animations.

## 9. Notifications and Emails

- [x] Add notifications and emails for admin balance updates (credit/debit).
- [x] Add notifications and emails for loan approval.
- [x] Add notifications and emails for loan repayment.
- [x] Add notifications and emails for user savings deposit.
- [x] Add notifications and emails for user savings interest withdrawal.
- [x] Add notifications and emails for user savings plan cancellation.
