# CHAPTER 9: APPLICATION INTERFACE

## 9.1 Login Page

The login page serves as the entry point for authenticated users. It presents a clean, centred form with email and password fields, a password visibility toggle, and a sign-in button with loading state feedback. Below the form, demo account credentials are displayed for evaluation convenience.

**Key Interface Elements:**
- Application logo and title ("UPI Fraud Detector")
- Email input field with envelope icon prefix
- Password input field with lock icon prefix and eye/eye-off visibility toggle
- "Sign In" button that transitions to a spinning loader during authentication
- "Create one" link navigating to the registration page
- Demo accounts panel displaying admin, analyst, and user credentials

The page uses a gradient background (blue tones) with a white card layout to establish the application's visual identity.

## 9.2 Dashboard

The dashboard is the primary monitoring interface, presenting real-time system statistics through a combination of KPI cards, trend charts, and activity lists.

**KPI Cards (Top Row):**
- **Total Transactions:** Displays the cumulative count of all transactions processed.
- **Fraud Detected:** Shows the number of transactions classified as fraudulent, with a percentage badge indicating the fraud rate.
- **Legitimate:** Displays the count of transactions cleared as legitimate.
- **Total Volume:** Shows the total monetary value of all transactions in INR, formatted with the Indian numbering system (lakhs and crores).

**Transaction Trend Chart:**
A 7-day area chart (built with Recharts) visualises daily transaction volumes. Two overlapping areas represent total transactions (light blue fill) and fraud cases (red fill), enabling quick visual identification of fraud spikes relative to overall volume.

**Risk and Status Breakdown:**
Two pie charts display the distribution of transactions by risk level (LOW in green, MEDIUM in amber, HIGH in red) and by status (COMPLETED in green, FLAGGED in yellow, BLOCKED in red, FAILED in grey).

**Recent Transactions Table:**
The five most recent transactions are displayed with columns for transaction ID (truncated for readability), amount (formatted in INR), risk level (colour-coded badge), status, and timestamp (relative time format such as "2 minutes ago").

**Recent Alerts Panel:**
The five most recent alerts are shown with severity badges, alert titles, and timestamps. Unread alerts are visually distinguished with a dot indicator.

**Refresh Control:**
A refresh button in the page header allows manual data refresh. During refresh, a spinning icon provides visual feedback. An error indicator appears if the dashboard is displaying fallback data due to API connectivity issues.

## 9.3 Transactions Page

The transactions page provides a comprehensive view of all transactions with filtering and search capabilities.

**Filter Controls:**
- **Search Bar:** Filters transactions by transaction ID, sender UPI, or receiver UPI using a text search input.
- **Fraud Filter:** Dropdown allowing selection of "All", "Fraud Only", or "Legitimate Only".
- **Status Filter:** Dropdown filtering by transaction status (All, Completed, Flagged, Blocked, Failed).
- **Risk Filter:** Dropdown filtering by risk level (All, Low, Medium, High).

**Transaction Table:**
A full-width table displaying all matching transactions with the following columns:
- **Transaction ID:** Truncated to first 15 characters with full ID on hover.
- **Sender → Receiver:** UPI addresses with truncation for long addresses.
- **Amount:** Formatted in INR with the ₹ symbol.
- **Type:** Transaction type badge (P2P, P2M, BILL, RECHARGE).
- **Risk Level:** Colour-coded badge (green for LOW, amber for MEDIUM, red for HIGH).
- **Fraud Probability:** Percentage displayed with a colour gradient.
- **Status:** Colour-coded status badge.
- **Date:** Formatted in Indian date format (DD/MM/YYYY).

**Empty State:**
When no transactions match the active filters, a friendly empty state message is displayed with a "Clear Filters" action button.

## 9.4 Check Transaction Page

This page provides the manual fraud-checking interface where users can submit new transactions for real-time fraud analysis.

**Input Form:**
- **Sender UPI:** Text input for the sender's Virtual Payment Address.
- **Receiver UPI:** Text input for the receiver's Virtual Payment Address.
- **Amount (₹):** Numeric input for the transaction amount.
- **Transaction Type:** Dropdown selection (P2P, P2M, Bill Payment, Recharge).
- **Submit Button:** "Check Transaction" with loading spinner during processing.
- **Reset Button:** Clears all form fields.

**Result Display:**
After submission, the result panel slides into view with an animation and displays:
- **Fraud Probability:** A large percentage display with colour coding (green for low risk, amber for medium, red for high).
- **Risk Level:** Text badge (LOW, MEDIUM, or HIGH).
- **Transaction Status:** The assigned status (COMPLETED, FLAGGED, or BLOCKED) with colour coding.
- **Transaction ID:** The generated transaction reference number.
- **Amount:** The transaction amount in formatted INR.

The result panel uses colour-coded backgrounds — green gradient for legitimate transactions, amber for suspicious, and red for fraudulent — providing immediate visual feedback on the fraud assessment.

## 9.5 Alerts Page

The alerts page provides a dedicated interface for monitoring and managing fraud alerts.

**Alert Statistics Panel:**
Four metric cards at the top display:
- Total alerts count
- Unread alerts count (with emphasis if non-zero)
- Critical alerts count (highlighted in red)
- High-severity alerts count (highlighted in orange)

**Filter Controls:**
- **Severity Filter:** Buttons for ALL, CRITICAL, HIGH, MEDIUM, LOW — allowing quick filtering by severity level.
- **Read Status Filter:** Dropdown for All, Unread, and Read alerts.
- **Mark All Read:** Bulk action button to mark all visible alerts as read.

**Alert Cards:**
Each alert is displayed as a card containing:
- **Severity Badge:** Colour-coded badge (red for CRITICAL, orange for HIGH, yellow for MEDIUM, blue for LOW).
- **Alert Title:** Brief description of the alert.
- **Alert Message:** Detailed information about the triggering condition.
- **Timestamp:** Relative time since the alert was created.
- **Read/Unread Indicator:** Visual dot for unread alerts.
- **Action Buttons:** "Mark as Read" and "Resolve" buttons (visible for ANALYST and ADMIN roles).

## 9.6 Analytics Page

The analytics page presents detailed analytical views for in-depth fraud pattern analysis.

**ML Service Status Panel:**
Displays the machine learning service status including:
- Service availability indicator (green dot for available, red for unavailable).
- Model version number.
- Total predictions served.
- Service health details.

**Analytical Charts:**
Multiple chart panels provide different perspectives on the transaction data:
- Transaction volume trends over time.
- Fraud rate analysis across different dimensions.
- Amount distribution analysis.

## 9.7 Navigation and Layout

**Sidebar Navigation:**
The application uses a fixed left sidebar with navigation links to all pages:
- Dashboard (home icon)
- Transactions (list icon)
- Check Transaction (search icon)
- Alerts (bell icon with unread badge)
- Analytics (chart icon)

The sidebar highlights the active page and collapses to icons on smaller screens. At the bottom, user information (name, role) and a logout button are displayed.

**Header Bar:**
Each page includes a header bar with the page title and contextual actions (such as the refresh button on the Dashboard or filter controls on the Transactions page).

**Toast Notifications:**
User actions (successful login, transaction submission, alert resolution) trigger toast notifications that appear temporarily at the top of the screen, providing non-intrusive feedback without disrupting the user's workflow.

**Responsive Behaviour:**
The layout adapts to different screen sizes:
- Desktop (≥ 1024px): Full sidebar with labels, multi-column card layouts.
- Tablet (768-1023px): Collapsed sidebar with icons, two-column card layouts.
- Mobile (< 768px): Hidden sidebar with hamburger menu, single-column layout, simplified table views.
