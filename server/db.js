import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'clinic_data.json');

// Ensure data folder exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const initialData = {
  clinicProfile: {
    name: "Apex Dentocare & Implant Center",
    tagline: "Advanced Digital Dentistry & Micro-Endodontics",
    doctorInCharge: "Dr. Yugal Sharma, BDS, MDS (Prosthodontics & Implantology)",
    regNo: "NMC-84920",
    phone: "+977 98012 34567",
    whatsappPhone: "9779801234567",
    email: "contact@apexdental.com.np",
    address: "Metro Healthcare Towers, New Baneshwor, Ward 10, Kathmandu, Nepal",
    panVat: "601234567",
    gstin: "PAN: 601234567",
    currency: "Rs."
  },
  doctors: [
    {
      id: "DOC-1",
      name: "Dr. Yugal Sharma",
      specialty: "Prosthodontics & Implantology",
      qualification: "BDS, MDS",
      regNumber: "NMC-84920",
      phone: "+977 98012 34567",
      color: "#2563eb"
    },
    {
      id: "DOC-2",
      name: "Dr. Ananya Roy",
      specialty: "Endodontics & Conservative Dentistry",
      qualification: "BDS, MDS",
      regNumber: "NMC-91042",
      phone: "+977 98112 23456",
      color: "#059669"
    },
    {
      id: "DOC-3",
      name: "Dr. Rajesh Verma",
      specialty: "Oral & Maxillofacial Surgery",
      qualification: "BDS, MDS, FIBOMS",
      regNumber: "NMC-74821",
      phone: "+977 98212 34567",
      color: "#7c3aed"
    }
  ],
  chairs: ["Chair 1 (Main Operatory)", "Chair 2 (Surgical & Implants)", "Chair 3 (Hygiene & Pediatric)"],
  treatmentCatalog: [
    { id: "TRT-1", code: "D0150", name: "Comprehensive Oral Examination", category: "Diagnostic", defaultCost: 500 },
    { id: "TRT-2", code: "D1110", name: "Full Mouth Ultrasonic Scaling & Polishing", category: "Preventive", defaultCost: 1500 },
    { id: "TRT-3", code: "D2391", name: "Composite Resin Restoration (1 Surface)", category: "Restorative", defaultCost: 1800 },
    { id: "TRT-4", code: "D2392", name: "Composite Resin Restoration (2 Surfaces)", category: "Restorative", defaultCost: 2500 },
    { id: "TRT-5", code: "D3310", name: "Root Canal Treatment - Anterior", category: "Endodontics", defaultCost: 4000 },
    { id: "TRT-6", code: "D3320", name: "Root Canal Treatment - Bicuspid / Premolar", category: "Endodontics", defaultCost: 5000 },
    { id: "TRT-7", code: "D3330", name: "Root Canal Treatment - Molar (Rotary / Apex Locator)", category: "Endodontics", defaultCost: 6500 },
    { id: "TRT-8", code: "D2740", name: "Zirconia High-Translucency Crown", category: "Prosthodontics", defaultCost: 8500 },
    { id: "TRT-9", code: "D2750", name: "Porcelain Fused to Metal (PFM) Crown", category: "Prosthodontics", defaultCost: 4500 },
    { id: "TRT-10", code: "D6010", name: "Endosteal Dental Implant (Titanium) with Abutment", category: "Implantology", defaultCost: 28000 },
    { id: "TRT-11", code: "D7140", name: "Simple Tooth Extraction", category: "Oral Surgery", defaultCost: 1200 },
    { id: "TRT-12", code: "D7210", name: "Surgical Impacted Wisdom Tooth Extraction", category: "Oral Surgery", defaultCost: 5000 },
    { id: "TRT-13", code: "D2962", name: "Ceramic / E-Max Porcelain Veneer", category: "Cosmetic", defaultCost: 9500 },
    { id: "TRT-14", code: "D5110", name: "Complete Upper or Lower Denture", category: "Prosthodontics", defaultCost: 18000 },
    { id: "TRT-15", code: "D8080", name: "Orthodontic Aligners / Ceramic Braces (Stage 1)", category: "Orthodontics", defaultCost: 45000 },
    { id: "TRT-16", code: "D4341", name: "Deep Scaling & Root Planing (Per Quadrant)", category: "Periodontics", defaultCost: 2000 }
  ],
  medicineFormulary: [
    {
      id: "MED-1",
      name: "Augmentin 625mg (Amoxicillin + Clavulanate)",
      dosage: "625 mg",
      frequency: "1 tablet twice daily (1-0-1)",
      duration: "5 days",
      instructions: "Take after meals with plenty of water. Complete full course."
    },
    {
      id: "MED-2",
      name: "Amoxicillin 500mg",
      dosage: "500 mg",
      frequency: "1 capsule thrice daily (1-1-1)",
      duration: "5 days",
      instructions: "Take after meals. Inform doctor immediately if any rash or allergy occurs."
    },
    {
      id: "MED-3",
      name: "Metrogyl 400mg (Metronidazole)",
      dosage: "400 mg",
      frequency: "1 tablet thrice daily (1-1-1)",
      duration: "5 days",
      instructions: "Take strictly after meals. Strictly avoid alcohol during treatment."
    },
    {
      id: "MED-4",
      name: "Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)",
      dosage: "100mg/325mg/15mg",
      frequency: "1 tablet twice daily (1-0-1)",
      duration: "3 days",
      instructions: "Take after food. Relieves pain and post-op swelling."
    },
    {
      id: "MED-5",
      name: "Ketorol DT (Ketorolac Tromethamine 10mg)",
      dosage: "10 mg Dispersible",
      frequency: "1 tablet SOS (as needed for severe pain)",
      duration: "2 days",
      instructions: "Disperse in half a cup of water. Maximum 40mg per 24 hours."
    },
    {
      id: "MED-6",
      name: "Pantocid 40mg (Pantoprazole)",
      dosage: "40 mg",
      frequency: "1 tablet once daily morning (1-0-0)",
      duration: "5 days",
      instructions: "Take 30 minutes before breakfast on an empty stomach."
    },
    {
      id: "MED-7",
      name: "Hexidine Mouthwash (0.2% Chlorhexidine Gluconate)",
      dosage: "10 ml undiluted",
      frequency: "Twice daily morning and night",
      duration: "10 days",
      instructions: "Swish vigorously for 1 minute then spit out. Do not rinse with water or eat for 30 minutes."
    },
    {
      id: "MED-8",
      name: "Kenacort 0.1% Oral Paste (Triamcinolone Acetonide)",
      dosage: "Small dab",
      frequency: "Apply 2-3 times daily after meals",
      duration: "5 days",
      instructions: "Dab gently over oral ulcer/aphthae. Do not rub."
    }
  ],
  whatsappTemplates: [
    {
      id: "TPL-APPT-CONFIRM",
      title: "Appointment Confirmation",
      category: "Appointment",
      body: "Hello *{patientName}*,\n\nYour appointment at *{clinicName}* has been confirmed:\n🗓️ *Date:* {appointmentDate}\n⏰ *Time:* {appointmentTime}\n👨‍⚕️ *Doctor:* {doctorName}\n📍 *Location:* {clinicAddress}\n\n🔗 *Patient Auto Link:* {autoLink}\n\nPlease arrive 10 minutes prior to your slot. If you need to reschedule, kindly reply to this message or call {clinicPhone}.\n\nWarm regards,\n*{clinicName} Team*"
    },
    {
      id: "TPL-APPT-REMINDER",
      title: "24-Hour Reminder",
      category: "Appointment",
      body: "Dear *{patientName}*,\n\nThis is a friendly reminder for your upcoming dental visit tomorrow at *{clinicName}* on *{appointmentDate}* at *{appointmentTime}* with *{doctorName}*.\n\n🔗 *View Appointment Details:* {autoLink}\n\nWe look forward to seeing you. Please let us know if you need any directions or assistance!\n\n📞 {clinicPhone}"
    },
    {
      id: "TPL-POST-OP-EXTRACTION",
      title: "Post-Tooth Extraction Care Instructions",
      category: "Care Guidelines",
      body: "Dear *{patientName}*,\n\nHere are important care guidelines following your tooth extraction today at *{clinicName}*:\n\n1. Keep gauze firmly pressed over the extraction site for 45 minutes.\n2. Do NOT spit, gargle, or drink through a straw for the next 24 hours.\n3. Eat soft, cool foods (ice cream, curd, cold soup, khichdi). Avoid hot, spicy, or crunchy foods.\n4. Take prescribed medicines on time.\n5. Tomorrow onwards, gently rinse with warm salt water after meals.\n\nIn case of prolonged bleeding or sharp pain, reach us immediately at *{clinicPhone}*."
    },
    {
      id: "TPL-POST-OP-RCT",
      title: "Post-Root Canal Treatment Care",
      category: "Care Guidelines",
      body: "Dear *{patientName}*,\n\nFollowing your Root Canal procedure today on tooth #{toothNumber}:\n\n• Avoid chewing hard or sticky foods on the treated side until the permanent crown is placed.\n• Mild soreness when biting is normal for 48-72 hours. Take your prescribed pain medications.\n• Maintain regular gentle brushing and flossing.\n\nYour next sitting is scheduled soon. Feel free to contact us at {clinicPhone} for any queries."
    },
    {
      id: "TPL-INVOICE",
      title: "Invoice & Payment Receipt",
      category: "Billing",
      body: "Dear *{patientName}*,\n\nThank you for choosing *{clinicName}*.\n\n📄 *Invoice #:* {invoiceNumber}\n💰 *Total Amount:* {totalAmount}\n💳 *Paid Amount:* {paidAmount}\n⚖️ *Balance Due:* {balanceDue}\n\n🔗 *Digital Invoice Auto Link:* {autoLink}\n\nFor digital payment via eSewa, Khalti, or Fonepay QR, please pay directly to our clinic number: *{clinicPhone}*\n\nWishing you a healthy, bright smile!"
    },
    {
      id: "TPL-DIGITAL-PORTAL",
      title: "Client Portal & Digital Summary Auto Link",
      category: "Auto Link",
      body: "Dear *{patientName}*,\n\nGreetings from *{clinicName}*!\n\nYou can access your digital dental records, prescriptions, and invoice receipts anytime using your personalized auto link:\n🔗 *Access Link:* {autoLink}\n\nFor appointments or urgent inquiries, contact us at {clinicPhone}.\n\nWarm regards,\n*{clinicName} Team*"
    },
    {
      id: "TPL-RECALL-6MO",
      title: "6-Month Dental Recall & Checkup",
      category: "Recall",
      body: "Hi *{patientName}*,\n\nIt has been 6 months since your last dental visit at *{clinicName}*! 🦷✨\n\nRegular checkups and preventive scaling ensure your gums stay healthy, prevent plaque buildup, and catch cavities early.\n\nBook your routine checkup today by replying to this message or calling {clinicPhone}.\n\nKeep smiling!"
    }
  ],
  patients: [
    {
      id: "PT-1001",
      name: "Rohit Malhotra",
      phone: "+977 98112 34567",
      age: 34,
      gender: "Male",
      bloodGroup: "B+",
      allergies: ["Penicillin"],
      medicalHistory: ["Mild Asthma"],
      address: "New Baneshwor Tol, Ward 10, Kathmandu Metropolitan City, Kathmandu, Bagmati Province",
      province: "Bagmati Province",
      district: "Kathmandu",
      municipality: "Kathmandu Metropolitan City",
      ward: "Ward 10",
      tole: "New Baneshwor",
      emergencyContact: "+977 98112 99999 (Family)",
      createdAt: "2026-09-12T10:30:00Z",
      dentalChart: {
        "16": {
          toothId: "16",
          condition: "decay",
          surfaces: { occlusal: "decay", mesial: "decay", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Deep disto-occlusal caries extending near pulp horn. Cold test sensitive."
        },
        "18": {
          toothId: "18",
          condition: "missing",
          surfaces: { occlusal: "healthy", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Extracted in 2023 due to impaction."
        },
        "26": {
          toothId: "26",
          condition: "crown",
          surfaces: { occlusal: "healthy", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Zirconia full contour crown, seated well."
        },
        "36": {
          toothId: "36",
          condition: "rct",
          surfaces: { occlusal: "filling_composite", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "RCT completed. Needs permanent full crown."
        },
        "46": {
          toothId: "46",
          condition: "implant",
          surfaces: { occlusal: "healthy", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Titanium implant placed with screw-retained crown."
        },
        "47": {
          toothId: "47",
          condition: "filling_composite",
          surfaces: { occlusal: "filling_composite", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Class I composite restoration intact."
        }
      },
      treatmentPlans: [
        {
          id: "TP-101",
          tooth: "16",
          surface: "MO",
          procedureName: "Composite Resin Restoration (2 Surfaces)",
          code: "D2392",
          cost: 2500,
          status: "Planned",
          date: "2026-10-22",
          notes: "Excavate deep decay, apply Dycal base and bulk fill composite"
        },
        {
          id: "TP-102",
          tooth: "36",
          surface: "Full Crown",
          procedureName: "Zirconia High-Translucency Crown",
          code: "D2740",
          cost: 8500,
          status: "Planned",
          date: "2026-10-25",
          notes: "Tooth prep, digital intraoral scan, lab fabrication"
        }
      ],
      notes: [
        {
          id: "NOTE-1",
          date: "2026-10-20",
          doctor: "Dr. Yugal Sharma",
          type: "SOAP",
          content: "S: Patient complains of sensitivity to sweets and cold food in upper right back tooth.\nO: Deep MO cavity on tooth #16. EPT positive, lingers 3 seconds. Gums healthy.\nA: Moderate Dental Caries #16 without irreversible pulpitis.\nP: Advised Class II Composite Restoration on #16. Informed consent obtained."
        }
      ],
      prescriptions: [
        {
          id: "RX-1",
          date: "2026-10-20",
          doctor: "Dr. Yugal Sharma",
          diagnosis: "Deep Caries #16 with reversible pulpitis",
          medicines: [
            { name: "Zerodol-SP", dosage: "100/325mg", frequency: "1-0-1", duration: "3 days", instructions: "After food" },
            { name: "Hexidine Mouthwash", dosage: "10 ml", frequency: "Twice daily", duration: "7 days", instructions: "Rinse 1 min" }
          ],
          instructions: "Avoid hard chewing on right side until restoration is completed."
        }
      ],
      invoices: [
        {
          id: "INV-101",
          invoiceNumber: "INV-2026-0042",
          date: "2026-10-20",
          items: [
            { description: "Comprehensive Oral Examination", tooth: "General", qty: 1, unitPrice: 500, total: 500 },
            { description: "Digital Bitewing Radiograph (RVG)", tooth: "16", qty: 1, unitPrice: 300, total: 300 }
          ],
          subtotal: 800,
          discount: 100,
          taxPercent: 0,
          taxAmount: 0,
          total: 700,
          paid: 700,
          balance: 0,
          status: "Paid",
          paymentMethod: "UPI / GPay"
        }
      ]
    },
    {
      id: "PT-1002",
      name: "Pooja Singhania",
      phone: "+977 97188 65432",
      age: 28,
      gender: "Female",
      bloodGroup: "O+",
      allergies: [],
      medicalHistory: ["None reported"],
      address: "Lakeside Tol, Ward 6, Pokhara Metropolitan City, Kaski, Gandaki Province",
      province: "Gandaki Province",
      district: "Kaski",
      municipality: "Pokhara Metropolitan City",
      ward: "Ward 6",
      tole: "Lakeside",
      emergencyContact: "+977 97188 11111 (Mother)",
      createdAt: "2026-09-25T14:15:00Z",
      dentalChart: {
        "11": {
          toothId: "11",
          condition: "veneer",
          surfaces: { occlusal: "healthy", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Ceramic veneer placed for aesthetic midline closure."
        },
        "21": {
          toothId: "21",
          condition: "veneer",
          surfaces: { occlusal: "healthy", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Ceramic veneer matched shade BL2."
        },
        "37": {
          toothId: "37",
          condition: "decay",
          surfaces: { occlusal: "decay", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Pit and fissure decay on occlusal table."
        }
      },
      treatmentPlans: [
        {
          id: "TP-201",
          tooth: "37",
          surface: "O",
          procedureName: "Composite Resin Restoration (1 Surface)",
          code: "D2391",
          cost: 1800,
          status: "Planned",
          date: "2026-10-23",
          notes: "Pit caries cleanup and microhybrid composite"
        }
      ],
      notes: [],
      prescriptions: [],
      invoices: []
    },
    {
      id: "PT-1003",
      name: "Master Aarav Gupta",
      phone: "+977 99554 11223",
      age: 7,
      gender: "Male",
      bloodGroup: "A+",
      allergies: [],
      medicalHistory: ["Pediatric patient - deciduous/primary dentition"],
      address: "Traffic Chowk Tol, Ward 4, Butwal Sub-Metropolitan City, Rupandehi, Lumbini Province",
      province: "Lumbini Province",
      district: "Rupandehi",
      municipality: "Butwal Sub-Metropolitan City",
      ward: "Ward 4",
      tole: "Traffic Chowk",
      emergencyContact: "+977 99554 11223 (Father)",
      createdAt: "2026-10-01T09:00:00Z",
      dentalChart: {
        "54": {
          toothId: "54",
          condition: "decay",
          surfaces: { occlusal: "decay", mesial: "healthy", distal: "decay", buccal: "healthy", lingual: "healthy" },
          notes: "Primary 1st molar interproximal decay."
        },
        "64": {
          toothId: "64",
          condition: "filling_composite",
          surfaces: { occlusal: "filling_composite", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Glass Ionomer Cement (GIC) restoration."
        },
        "75": {
          toothId: "75",
          condition: "crown",
          surfaces: { occlusal: "healthy", mesial: "healthy", distal: "healthy", buccal: "healthy", lingual: "healthy" },
          notes: "Stainless Steel Crown (SSC) after pulpotomy."
        }
      },
      treatmentPlans: [
        {
          id: "TP-301",
          tooth: "54",
          surface: "DO",
          procedureName: "Pediatric Pulpotomy + Preformed Crown",
          code: "D2930",
          cost: 3500,
          status: "Planned",
          date: "2026-10-24",
          notes: "MTA pulpotomy and stainless steel crown"
        }
      ],
      notes: [],
      prescriptions: [],
      invoices: []
    }
  ],
  appointments: [
    {
      id: "APT-1001",
      patientId: "PT-1001",
      patientName: "Rohit Malhotra",
      patientPhone: "+977 98112 34567",
      doctorName: "Dr. Yugal Sharma",
      chair: "Chair 1 (Main Operatory)",
      date: "2026-10-21",
      time: "10:30 AM",
      durationMinutes: 45,
      treatmentType: "Composite Restoration #16",
      status: "In Chair",
      notes: "Arrived on time. Pre-op vitals normal BP 122/80."
    },
    {
      id: "APT-1002",
      patientId: "PT-1002",
      patientName: "Pooja Singhania",
      patientPhone: "+977 97188 65432",
      doctorName: "Dr. Ananya Roy",
      chair: "Chair 2 (Surgical & Implants)",
      date: "2026-10-21",
      time: "12:00 PM",
      durationMinutes: 30,
      treatmentType: "Restoration Tooth #37",
      status: "Confirmed",
      notes: "Follow-up aesthetic review and restoration."
    },
    {
      id: "APT-1003",
      patientId: "PT-1003",
      patientName: "Master Aarav Gupta",
      patientPhone: "+977 99554 11223",
      doctorName: "Dr. Yugal Sharma",
      chair: "Chair 3 (Hygiene & Pediatric)",
      date: "2026-10-21",
      time: "02:30 PM",
      durationMinutes: 40,
      treatmentType: "Pediatric Pulpotomy #54",
      status: "Scheduled",
      notes: "Parent requested gentle behavioral management."
    },
    {
      id: "APT-1004",
      patientId: "PT-1001",
      patientName: "Rohit Malhotra",
      patientPhone: "+977 98112 34567",
      doctorName: "Dr. Yugal Sharma",
      chair: "Chair 1 (Main Operatory)",
      date: "2026-10-25",
      time: "11:00 AM",
      durationMinutes: 60,
      treatmentType: "Crown Preparation #36",
      status: "Scheduled",
      notes: "Zirconia crown prep and digital scan."
    }
  ],
  suggestions: {
    allergies: [
      "Penicillin",
      "Amoxicillin",
      "Sulfa Drugs",
      "NSAIDs / Ibuprofen",
      "Aspirin",
      "Latex",
      "Local Anesthesia (Lignocaine)",
      "Erythromycin",
      "Metronidazole",
      "Codeine"
    ],
    medicalHistory: [
      "Hypertension (High BP)",
      "Type 2 Diabetes",
      "Asthma / Respiratory Issues",
      "Cardiac Condition / Pacemaker",
      "Bleeding Tendency / On Blood Thinners",
      "Thyroid Disorder",
      "Pregnancy / Lactating",
      "Hepatitis B / C",
      "Gastric Acidity / Ulcer",
      "Kidney / Renal Disease",
      "Epilepsy / Seizures"
    ]
  }
};

// Database wrapper
class ClinicDatabase {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = JSON.parse(JSON.stringify(initialData));
        this.save();
      }
    } catch (err) {
      console.error("Error reading database file, resetting to initial:", err);
      this.data = JSON.parse(JSON.stringify(initialData));
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error writing database file:", err);
    }
  }

  getClinicProfile() {
    return this.data.clinicProfile;
  }

  updateClinicProfile(profile) {
    this.data.clinicProfile = { ...this.data.clinicProfile, ...profile };
    this.save();
    return this.data.clinicProfile;
  }

  getDoctors() {
    return this.data.doctors;
  }

  addDoctor(doctor) {
    const newId = `DOC-${Date.now().toString().slice(-4)}`;
    const newDoc = {
      id: newId,
      color: '#2563eb',
      ...doctor
    };
    if (!this.data.doctors) this.data.doctors = [];
    this.data.doctors.push(newDoc);
    this.save();
    return newDoc;
  }

  updateDoctor(id, updates) {
    if (!this.data.doctors) return null;
    const index = this.data.doctors.findIndex(d => d.id === id);
    if (index === -1) return null;
    this.data.doctors[index] = { ...this.data.doctors[index], ...updates };
    this.save();
    return this.data.doctors[index];
  }

  deleteDoctor(id) {
    if (!this.data.doctors) return false;
    const index = this.data.doctors.findIndex(d => d.id === id);
    if (index === -1) return false;
    this.data.doctors.splice(index, 1);
    this.save();
    return true;
  }

  getChairs() {
    return this.data.chairs || [];
  }

  addChair(chairName) {
    if (!chairName || typeof chairName !== 'string') return null;
    const trimmed = chairName.trim();
    if (!trimmed) return null;
    if (!this.data.chairs) this.data.chairs = [];
    if (!this.data.chairs.includes(trimmed)) {
      this.data.chairs.push(trimmed);
      this.save();
    }
    return this.data.chairs;
  }

  deleteChair(chairName) {
    if (!chairName || !this.data.chairs) return false;
    const trimmed = chairName.trim();
    const initialLen = this.data.chairs.length;
    this.data.chairs = this.data.chairs.filter(c => c !== trimmed);
    if (this.data.chairs.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  getTreatmentCatalog() {
    return this.data.treatmentCatalog;
  }

  addTreatment(treatment) {
    const newId = `TRT-${Date.now().toString().slice(-4)}`;
    const newTrt = {
      id: newId,
      code: treatment.code || `D${Math.floor(1000 + Math.random() * 9000)}`,
      name: treatment.name || 'New Dental Procedure',
      category: treatment.category || 'General',
      defaultCost: Number(treatment.defaultCost) || 0
    };
    if (!this.data.treatmentCatalog) this.data.treatmentCatalog = [];
    this.data.treatmentCatalog.push(newTrt);
    this.save();
    return newTrt;
  }

  updateTreatment(id, updates) {
    if (!this.data.treatmentCatalog) return null;
    const index = this.data.treatmentCatalog.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.data.treatmentCatalog[index] = {
      ...this.data.treatmentCatalog[index],
      ...updates,
      defaultCost: updates.defaultCost !== undefined ? Number(updates.defaultCost) || 0 : this.data.treatmentCatalog[index].defaultCost
    };
    this.save();
    return this.data.treatmentCatalog[index];
  }

  deleteTreatment(id) {
    if (!this.data.treatmentCatalog) return false;
    const index = this.data.treatmentCatalog.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.data.treatmentCatalog.splice(index, 1);
    this.save();
    return true;
  }

  getMedicineFormulary() {
    return this.data.medicineFormulary;
  }

  getWhatsappTemplates() {
    return this.data.whatsappTemplates;
  }

  getSuggestions() {
    if (!this.data.suggestions) {
      this.data.suggestions = {
        allergies: [
          "Penicillin",
          "Amoxicillin",
          "Sulfa Drugs",
          "NSAIDs / Ibuprofen",
          "Aspirin",
          "Latex",
          "Local Anesthesia (Lignocaine)",
          "Erythromycin",
          "Metronidazole",
          "Codeine"
        ],
        medicalHistory: [
          "Hypertension (High BP)",
          "Type 2 Diabetes",
          "Asthma / Respiratory Issues",
          "Cardiac Condition / Pacemaker",
          "Bleeding Tendency / On Blood Thinners",
          "Thyroid Disorder",
          "Pregnancy / Lactating",
          "Hepatitis B / C",
          "Gastric Acidity / Ulcer",
          "Kidney / Renal Disease",
          "Epilepsy / Seizures"
        ]
      };
    }

    // Accumulate unique items from all saved patients
    const patientAllergies = (this.data.patients || []).flatMap(p =>
      Array.isArray(p.allergies) ? p.allergies : (p.allergies ? p.allergies.split(',') : [])
    ).map(s => s.trim()).filter(Boolean);

    const patientMed = (this.data.patients || []).flatMap(p =>
      Array.isArray(p.medicalHistory) ? p.medicalHistory : (p.medicalHistory ? p.medicalHistory.split(',') : [])
    ).map(s => s.trim()).filter(Boolean);

    // Merge without case-insensitive duplicates
    const mergeUnique = (base, extra) => {
      const result = [...base];
      extra.forEach(item => {
        if (!result.some(r => r.toLowerCase() === item.toLowerCase())) {
          result.push(item);
        }
      });
      return result;
    };

    return {
      allergies: mergeUnique(this.data.suggestions.allergies || [], patientAllergies),
      medicalHistory: mergeUnique(this.data.suggestions.medicalHistory || [], patientMed)
    };
  }

  addSuggestions({ allergies = [], medicalHistory = [] }) {
    if (!this.data.suggestions) {
      this.data.suggestions = { allergies: [], medicalHistory: [] };
    }
    const cleanAdd = (list, item) => {
      const clean = item.trim();
      if (clean && !list.some(existing => existing.toLowerCase() === clean.toLowerCase())) {
        list.push(clean);
      }
    };

    if (Array.isArray(allergies)) {
      allergies.forEach(a => cleanAdd(this.data.suggestions.allergies, a));
    }
    if (Array.isArray(medicalHistory)) {
      medicalHistory.forEach(m => cleanAdd(this.data.suggestions.medicalHistory, m));
    }

    this.save();
    return this.getSuggestions();
  }

  getPatients() {
    return this.data.patients;
  }

  getPatientById(id) {
    return this.data.patients.find(p => p.id === id);
  }

  addPatient(patient) {
    const newId = `PT-${1000 + this.data.patients.length + 1}`;
    const newPatient = {
      id: newId,
      createdAt: new Date().toISOString(),
      dentalChart: {},
      treatmentPlans: [],
      notes: [],
      prescriptions: [],
      invoices: [],
      ...patient
    };
    this.data.patients.unshift(newPatient);
    this.save();
    return newPatient;
  }

  updatePatient(id, updates) {
    const index = this.data.patients.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.patients[index] = { ...this.data.patients[index], ...updates };
    this.save();
    return this.data.patients[index];
  }

  deletePatient(id) {
    const index = this.data.patients.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.patients.splice(index, 1);
    // Also remove appointments for this patient
    this.data.appointments = this.data.appointments.filter(a => a.patientId !== id);
    this.save();
    return true;
  }

  updateDentalChart(patientId, toothId, toothData) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;
    if (!patient.dentalChart) patient.dentalChart = {};
    patient.dentalChart[toothId] = toothData;
    this.save();
    return patient.dentalChart;
  }

  addTreatmentPlan(patientId, plan) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;
    const newPlan = {
      id: `TP-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Planned',
      ...plan
    };
    if (!patient.treatmentPlans) patient.treatmentPlans = [];
    patient.treatmentPlans.push(newPlan);
    this.save();
    return newPlan;
  }

  updateTreatmentPlanStatus(patientId, planId, status) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;
    const plan = (patient.treatmentPlans || []).find(p => p.id === planId);
    if (!plan) return null;
    plan.status = status;
    this.save();
    return plan;
  }

  addClinicalNote(patientId, note) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;
    const newNote = {
      id: `NOTE-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      ...note
    };
    if (!patient.notes) patient.notes = [];
    patient.notes.unshift(newNote);
    this.save();
    return newNote;
  }

  addPrescription(patientId, prescription) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;
    const newRx = {
      id: `RX-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      ...prescription
    };
    if (!patient.prescriptions) patient.prescriptions = [];
    patient.prescriptions.unshift(newRx);
    this.save();
    return newRx;
  }

  addInvoice(patientId, invoice) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;
    const invCount = (patient.invoices || []).length + 1;
    const newInvoice = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `INV-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: new Date().toISOString().split('T')[0],
      ...invoice
    };
    if (!patient.invoices) patient.invoices = [];
    patient.invoices.unshift(newInvoice);
    this.save();
    return newInvoice;
  }

  getAppointments() {
    return this.data.appointments;
  }

  addAppointment(appointment) {
    const newApt = {
      id: `APT-${Date.now().toString().slice(-4)}`,
      status: 'Scheduled',
      ...appointment
    };
    this.data.appointments.push(newApt);
    this.save();
    return newApt;
  }

  updateAppointment(id, updates) {
    const apt = this.data.appointments.find(a => a.id === id);
    if (!apt) return null;
    Object.assign(apt, updates);
    this.save();
    return apt;
  }

  deleteAppointment(id) {
    const index = this.data.appointments.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.data.appointments.splice(index, 1);
    this.save();
    return true;
  }
}

export const db = new ClinicDatabase();
