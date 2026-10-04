# LifeDrop 🩸 – Blood Donation Network

LifeDrop is a modern, responsive web application designed to bridge the gap between voluntary blood donors and patients in urgent need. Built as an interactive frontend with real-time cloud data storage powered by **Supabase**.

---

## 🌟 Key Features

- **🩸 Interactive Blood Compatibility Matrix**: Visual guide showing which blood types can give to or receive from each other.
- **🔍 Find Nearby Donors**: Real-time filtering by blood group, city/area, and donor readiness (takes into account the 90-day cooldown period).
- **📋 Emergency Blood Requests**: Post urgent blood requirements with hospital details, units needed, and urgency level.
- **📝 Donor Registration**: Simple registration form storing verified contact info and donation history securely in the cloud.
- **☁️ Supabase Cloud Integration**: Centralized database that automatically saves and synchronizes donor and request data across all devices.
- **🩺 Eligibility Checker**: Quick 5-point self-assessment check based on age, weight, and recent health status.
- **🌓 Dark / Light Mode**: Seamless theme switching with system preferences support.
- **📱 Fully Responsive**: Optimized for desktop, tablets, and smartphones.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Semantic CSS3 (Custom Properties & Responsive Grid/Flexbox), Vanilla JavaScript (ES6+)
- **Database / Backend**: [Supabase](https://supabase.com/) (PostgreSQL cloud database & REST API)
- **Typography**: Google Fonts (*Bricolage Grotesque*, *Figtree*)
- **Icons**: Custom SVG graphics & blood drop animations

---

## 🗄️ Database Architecture

The application is connected to a Supabase PostgreSQL backend with two primary tables:

### 1. `donors` Table
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `donor_id` | `bigint` (PK) | Unique donor identifier |
| `name` | `text` | Full name of donor |
| `blood_group` | `text` | Blood group (`A+`, `O+`, `B+`, etc.) |
| `age` | `int` | Age (18–65) |
| `phone` | `text` | Contact phone number |
| `city` | `text` | City of residence |
| `last_donation_date` | `date` | Date of last donation |
| `available` | `boolean` | Current donation availability |
| `created_at` | `timestamp` | Timestamp of registration |

### 2. `blood_requests` Table
| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `request_id` | `bigint` (PK) | Unique request identifier |
| `patient_name` | `text` | Patient full name |
| `blood_group_needs`| `text` | Required blood group |
| `unit_needs` | `int` | Number of units needed |
| `hospital` | `text` | Hospital / medical center name |
| `city` | `text` | City or locality |
| `contact` | `text` | Emergency phone number |
| `status` | `text` | Request status (`Pending`, `Fulfilled`) |
| `created_at` | `timestamp` | Time request was submitted |

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### Running Locally
1. Clone or download this repository:
   ```bash
   git clone https://github.com/Divyaniambagade/LifeDrop.git
   ```
2. Navigate into the project folder:
   ```bash
   cd LifeDrop
   ```
3. Open `index.html` directly in your browser:
   - Double-click `index.html`, OR
   - Right-click and choose **Open with Live Server** (if using VS Code).

---

## 📁 Project Structure

```text
LifeDrop/
├── index.html        # Main landing page and UI structure
├── style.css         # Custom styling, color tokens, and responsive layout
├── script.js         # Core application logic, filters, and UI handlers
├── supabase.js       # Supabase client configuration and initialization
└── README.md         # Project documentation
```

---

## 🔒 Privacy & Disclaimer
LifeDrop is built as an academic/mini-project demonstration. In a real medical emergency, always reach out directly to certified blood banks, hospitals, or government-approved emergency services.
