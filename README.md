# 🦷 Apex Dental ERP & Interactive Practice Management System
> Built based on the architecture demonstrated in **"Best Dental Clinic Management Software in India | WhatsApp + AI Tool Explained"** (Dentobees) with high-definition **Anatomical Human Dental Charting (Odontogram)**, **Automated WhatsApp CRM**, and **AI Clinical Diagnostic Assistant**.

---

## 🌟 Key Features

### 1. 🦷 High-Definition Bold Anatomical Dental Chart (Odontogram)
- **Realistic Human Tooth Morphology**:
  - Maxillary (Upper) and Mandibular (Lower) dental arches with bold anatomical contours.
  - Distinct tooth morphologies: **Molars** (with multiple cusps & 2-3 roots), **Premolars** (bicuspid), **Canines** (sharp cuspid point with long anchor root), and **Incisors** (spade/chisel shaped incisal edge).
  - Pearly enamel gradient rendering with 3D drop-shadows and specular reflections.
- **Dual Dentition Modes**:
  - **Adult Permanent Dentition** (32 teeth: 11-18, 21-28, 31-38, 41-48 FDI or 1-32 Universal).
  - **Deciduous / Pediatric Dentition** (20 teeth: 51-55, 61-65, 71-75, 81-85 FDI or A-T Universal).
- **Interactive 5-Surface Diagram per Tooth**:
  - Occlusal / Incisal (O)
  - Mesial (M)
  - Distal (D)
  - Buccal / Facial (B)
  - Lingual / Palatal (L)
  - 1-click surface toggling for caries/cavities and aesthetic composite/amalgam fillings.
- **Bold Visual Clinical Conditions**:
  - **Caries / Decay** (Bright Red decay alert)
  - **Composite Fillings** (Tooth-colored sky blue)
  - **Amalgam Fillings** (Metallic slate)
  - **Full Crowns / Caps** (Gold / Amber contour)
  - **Root Canal Treatments (RCT)** (Crimson gutta-percha lines running through root canals)
  - **Dental Implants** (Titanium screw post fixture with abutment crown)
  - **Ceramic Veneers** (Aesthetic laminate mint green)
  - **Fractured / Broken Cusps** (Jagged red fracture lines)
  - **Missing / Extracted** (Extracted ghost outline with bold red cross-out)
- **Periodontal Probing & Mobility Tracking**:
  - 4-site pocket depths (Buccal, Lingual, Mesial, Distal) with color alerts for depths $\ge 5\text{ mm}$.
  - Mobility index grades (0 to 3).
- **Integrated Treatment Planning**:
  - Click any tooth to assign a procedure from the master catalog (e.g., Composite Restoration, Zirconia Crown, RCT, Extraction) with procedure code and estimated cost.
  - Automatically linked to patient's billable treatment plan.

---

### 2. 💬 WhatsApp Automation & CRM (From Video)
- **Instant Click-to-Chat / Web WhatsApp Integration**:
  - Uses Meta WhatsApp API protocol (`https://api.whatsapp.com/send?phone=...&text=...`).
- **Pre-Built Personalized Templates**:
  - **Appointment Booking & Confirmation** (Date, time, attending doctor, clinic address).
  - **24-Hour & 2-Hour Reminders** to reduce clinic no-shows.
  - **Post-Operative Care Guidelines** (Tooth Extraction care, Root Canal care, Scaling guidelines).
  - **Digital Prescription Summaries** sent straight to patient's phone.
  - **Invoices & Payment Links** with UPI VPA / QR details.
  - **6-Month Dental Recall Campaigns** to bring patients back for preventive hygiene.
- **Live WhatsApp Chat Simulator & Editor** in the UI with 1-click clipboard copy and launch.

---

### 3. 🤖 AI Dental Clinical Assistant (From Video)
- **Clinical Diagnostic & Treatment Suggestion Engine**:
  - Analyzes clinical symptoms (e.g., sharp night pain, lingering cold sensitivity, pericoronitis, bleeding gums).
  - Generates primary diagnosis, differential diagnoses, suggested CDT codes, treatment estimates, and required anesthesia / clinical precautions.
- **AI SOAP Note Generator**:
  - Automatically generates structured medicolegal clinical documentation (Subjective, Objective, Assessment, Plan) from quick chairside observations.
  - 1-click "Save to Patient EHR".
- **AI Patient Explainer (English & Hindi)**:
  - Translates complex dental jargon (e.g. Root Canal, Titanium Implants, Porcelain Crowns) into simple, reassuring language that patients understand and accept.
  - 1-click send directly to WhatsApp.

---

### 4. 📅 Smart Chair & Appointment Scheduler
- Chair-based timeline view:
  - **Chair 1** (Main Operatory / Restorative)
  - **Chair 2** (Surgical & Implants)
  - **Chair 3** (Hygiene & Pediatric)
- Status tracking: Scheduled $\rightarrow$ Confirmed $\rightarrow$ Checked In $\rightarrow$ In Chair $\rightarrow$ Completed $\rightarrow$ Cancelled.
- 1-click WhatsApp reminder button per booking.

---

### 5. 👥 Patient Digital EHR & Medical History
- Demographics, age, gender, blood group, emergency contact.
- High-visibility **Allergy Alert Badges** (Penicillin, Latex, NSAIDs).
- **Medical History Warnings** (Hypertension, Diabetes, Asthma, Bleeding Tendencies).
- Centralized tooth charting history, treatment plans, clinical notes, and billing.

---

### 6. 💳 Billing, Invoices & GST Tracking
- Convert treatment plan procedures into itemized invoices in 1 click.
- Subtotal, discounts, GST/tax calculation, paid amounts, balance due tracking.
- Payment modes: UPI / GPay / PhonePe, Cash, Credit/Debit Card, Net Banking.
- Printable, professional clinic receipts.

---

### 7. 💊 Digital Dental Prescription (Rx) Pad
- Built-in dental formulary: **Augmentin 625mg**, **Amoxicillin 500mg**, **Metrogyl 400mg**, **Zerodol-SP**, **Ketorol-DT**, **Pantocid**, **Hexidine 0.2% mouthwash**, **Kenacort oral paste**.
- Printable prescription pad with clinic letterhead and doctor signature space.

---

## 🚀 Running & Hosting the Application

### 🧑‍💻 Development Mode
To run with live hot-reloading (Vite on port 3000 + API on port 5000):
```bash
npm run dev
# OR double-click start-dental-app.bat on Windows
```

---

### 🌐 Production Mode (Local Server or LAN)
To build and run the optimized production bundle on a single port (5000):
```bash
# 1. Build client and prepare server
npm run build

# 2. Start production server
npm start
# OR double-click start-production.bat on Windows
```
Visit: 👉 **http://localhost:5000** (or `http://YOUR_LOCAL_IP:5000` from any device on your clinic Wi-Fi).

---

### ☁️ Production Hosting (Cloud / VPS / Docker)
The application is pre-configured and ready for hosting across all major platforms:

- **1-Click Cloud PaaS:** Ready for [Render](https://render.com) (via included `render.yaml`) and [Railway](https://railway.app).
- **Docker & Containers:** Run `docker compose up -d` (via included `Dockerfile` and `docker-compose.yml`).
- **Linux VPS (Ubuntu/Debian):** Nginx reverse proxy template (`nginx.conf`) and PM2 process management (`ecosystem.config.cjs`).
- **Health Checks:** Pre-configured endpoints at `/health` and `/api/health`.

📖 For complete, step-by-step instructions for each hosting method, see the [Deployment Guide](DEPLOYMENT.md).

---

## 🗄️ Database & Multi-Tenant Data Persistence
- All clinic records, multi-tenant databases, charts, prescriptions, financial ledgers, and AES-256 encrypted DICOM vaults are stored in:
  `server/data/`
- Automatic self-initialization on first boot. When hosting with Docker or cloud platforms, mount `server/data` to a persistent volume.
