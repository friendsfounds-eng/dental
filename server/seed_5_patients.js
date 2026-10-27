import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TENANT_FILE = path.join(__dirname, 'data', 'tenants', 'tenant-nepal-dental.json');

const newPatients = [
  {
    id: 'PT-1001',
    name: 'Aarav Sharma',
    phone: '9841234567',
    email: 'aarav.sharma@gmail.com',
    age: 32,
    gender: 'Male',
    bloodGroup: 'O+',
    address: 'House #45, Shanti Marga, New Baneshwor, Ward 10, Kathmandu, Bagmati Province',
    province: 'Bagmati Province',
    district: 'Kathmandu',
    municipality: 'Kathmandu Metropolitan City',
    ward: 'Ward 10',
    tole: 'New Baneshwor',
    emergencyContact: '9801987654 (Sunita Sharma - Spouse)',
    allergies: ['Penicillin (Urticaria/Rash)'],
    medicalHistory: ['Mild Bronchial Asthma', 'Occasional Acid Reflux (GERD)'],
    advanceCreditBalance: 1500,
    createdAt: '2026-10-24T09:30:00.000Z',
    dentalChart: {
      '16': {
        toothId: '16',
        condition: 'caries',
        surfaces: { occlusal: 'cavity_deep', mesial: 'healthy', distal: 'cavity_moderate', buccal: 'healthy', lingual: 'healthy' },
        pocketDepth: { b: 3, l: 3, m: 3, d: 3 },
        mobility: 0,
        notes: 'Deep disto-occlusal caries approaching pulp chamber'
      },
      '26': {
        toothId: '26',
        condition: 'restoration',
        surfaces: { occlusal: 'filling_composite', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'healthy' },
        pocketDepth: { b: 2, l: 2, m: 2, d: 2 },
        mobility: 0,
        notes: 'Class I Composite Restoration intact'
      },
      '36': {
        toothId: '36',
        condition: 'missing',
        surfaces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'healthy' },
        pocketDepth: { b: 0, l: 0, m: 0, d: 0 },
        mobility: 0,
        notes: 'Extracted 2 years ago due to non-restorable caries'
      }
    },
    treatmentPlans: [
      { id: 'TP-1001-1', title: 'Root Canal Treatment & Ceramic Crown #16', status: 'In Progress', estimatedCost: 11500 }
    ],
    notes: [
      {
        date: '2026-10-24',
        author: 'Dr. Mukesh Kushwaha',
        text: 'Chief Complaint: Severe nocturnal throbbing pain in upper right molar (#16). EPT positive with lingering response > 30s. Percussion positive. Diagnosis: Acute Irreversible Pulpitis #16.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2026-001',
        date: '2026-10-24',
        doctor: 'Dr. Mukesh Kushwaha',
        doctorId: 'DOC-1',
        diagnosis: 'Acute Irreversible Pulpitis #16',
        reviewTimeline: 'In 3 days for RCT Sitting 1',
        isFinalized: true,
        instructions: 'Avoid hard chewing on upper right quadrant. Warm saline rinse 3 times daily.',
        medicines: [
          {
            name: 'Cefixime 200mg (Safe for Penicillin Allergy)',
            genericName: 'Cefixime Trihydrate',
            dosage: '200 mg',
            frequency: '1 tablet twice daily (1-0-1)',
            duration: '5 days',
            instructions: 'Take after meals'
          },
          {
            name: 'Ketorol DT 10mg',
            genericName: 'Ketorolac Tromethamine',
            dosage: '10 mg Dispersible',
            frequency: '1 tablet SOS (when pain is severe)',
            duration: '3 days',
            instructions: 'Disperse in 1/2 glass of water after meals'
          },
          {
            name: 'Pantocid 40mg',
            genericName: 'Pantoprazole Sodium',
            dosage: '40 mg',
            frequency: '1 tablet once daily morning (1-0-0)',
            duration: '5 days',
            instructions: 'Take 30 mins before breakfast on empty stomach'
          }
        ]
      }
    ],
    invoices: [
      {
        id: 'INV-2026-001',
        invoiceNumber: 'INV-2026-001',
        date: '2026-10-24',
        isFinalized: true,
        items: [
          { name: 'Comprehensive Dental Examination & Odontogram', fee: 500, tooth: '' },
          { name: 'Diagnostic Digital IOPA Radiograph (#16)', fee: 350, tooth: '16' },
          { name: 'Emergency Pulpectomy & Pain Relief (#16)', fee: 1500, tooth: '16' }
        ],
        subtotal: 2350,
        discount: 150,
        taxPercent: 0,
        taxAmount: 0,
        total: 2200,
        paid: 2200,
        balance: 0,
        status: 'Paid',
        paymentMethod: 'Fonepay QR',
        doctorName: 'Dr. Mukesh Kushwaha'
      }
    ],
    orders: [
      {
        id: 'ORD-2026-001',
        patientId: 'PT-1001',
        patientName: 'Aarav Sharma',
        patientPhone: '9841234567',
        orderType: 'Crown',
        toothOrImplantDetails: 'Tooth #16',
        clinicalSpecifications: 'Monolithic Multi-Layer Zirconia Crown, Shade VITA A2, Chamfer margin',
        materials: 'Multi-layer Zirconia 3D Pro',
        assignedStaffOrLab: 'Kathmandu Dental Milling Lab',
        orderDate: '2026-10-24T11:00:00.000Z',
        expectedCompletionDate: '2026-10-29T15:00:00.000Z',
        cost: 5000,
        paymentStatus: 'Paid',
        progressStatus: 'In Progress',
        notes: [
          { author: 'Dr. Mukesh Kushwaha', text: 'Ensure passive fit and accurate contact points with #15 & #17.', date: '2026-10-24T11:15:00.000Z' }
        ]
      }
    ],
    imaging: [
      {
        id: 'XRAY-2026-001',
        title: 'Digital IOPA Radiograph #16 (Pre-Op)',
        radiographType: 'Periapical (IOPA)',
        toothNumbers: ['16'],
        format: 'png',
        encounterId: 'APT-2026-001',
        uploadedAt: '2026-10-24T10:15:00.000Z',
        diagnosticImpression: 'Deep disto-occlusal radiolucency approximating mesiobuccal pulp horn #16. Widened PDL space at root apex.'
      }
    ]
  },
  {
    id: 'PT-1002',
    name: 'Sunita Adhikari',
    phone: '9851122334',
    email: 'sunita.adhikari@outlook.com',
    age: 45,
    gender: 'Female',
    bloodGroup: 'A+',
    address: 'Pulchowk, Ward 3, Lalitpur Metropolitan City, Bagmati Province',
    province: 'Bagmati Province',
    district: 'Lalitpur',
    municipality: 'Lalitpur Metropolitan City',
    ward: 'Ward 3',
    tole: 'Pulchowk',
    emergencyContact: '9841998877 (Ramesh Adhikari - Brother)',
    allergies: [],
    medicalHistory: ['Hypertension (on Losartan 50mg OD)', 'Hypothyroidism (on Thyronorm 50mcg OD)'],
    advanceCreditBalance: 0,
    createdAt: '2026-10-25T08:45:00.000Z',
    dentalChart: {
      '31': {
        toothId: '31',
        condition: 'mobility_grade1',
        surfaces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'calculus' },
        pocketDepth: { b: 4, l: 4, m: 5, d: 4 },
        mobility: 1,
        notes: 'Deep subgingival pocket with calculus'
      },
      '41': {
        toothId: '41',
        condition: 'mobility_grade1',
        surfaces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'calculus' },
        pocketDepth: { b: 4, l: 4, m: 4, d: 5 },
        mobility: 1,
        notes: 'Subgingival calculus with bleeding on probing'
      },
      '24': {
        toothId: '24',
        condition: 'caries',
        surfaces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', buccal: 'cavity_shallow', lingual: 'healthy' },
        pocketDepth: { b: 2, l: 2, m: 2, d: 2 },
        mobility: 0,
        notes: 'Cervical enamel-dentin lesion'
      }
    },
    treatmentPlans: [
      { id: 'TP-1002-1', title: 'Periodontal Therapy & Scaling', status: 'Completed', estimatedCost: 3500 }
    ],
    notes: [
      {
        date: '2026-10-25',
        author: 'Dr. Anita Rayamajhi',
        text: 'Chief Complaint: Bleeding gums while brushing and mobility of lower front teeth. BOP 45%. Plan: Ultrasonic scaling and root planing.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2026-002',
        date: '2026-10-25',
        doctor: 'Dr. Anita Rayamajhi',
        doctorId: 'DOC-2',
        diagnosis: 'Chronic Generalized Periodontitis & Cervical Caries #24',
        reviewTimeline: 'In 7 days for root planing re-evaluation',
        isFinalized: true,
        instructions: 'Use modified Bass brushing technique with ultra-soft bristles. Warm water rinses.',
        medicines: [
          {
            name: 'Hexidine Mouthwash 160ml',
            genericName: 'Chlorhexidine Gluconate 0.2% w/v',
            dosage: '10 ml',
            frequency: 'Twice daily morning & night',
            duration: '10 days',
            instructions: 'Rinse vigorously for 1 minute then spit. Do not eat/drink for 30 mins.'
          },
          {
            name: 'Kenacort 0.1% Oral Paste',
            genericName: 'Triamcinolone Acetonide',
            dosage: 'Small dab',
            frequency: '2-3 times daily after food',
            duration: '5 days',
            instructions: 'Apply gently on irritated marginal gingiva. Do not rub.'
          },
          {
            name: 'Zerodol-SP',
            genericName: 'Aceclofenac + Paracetamol + Serratiopeptidase',
            dosage: '100/325/15 mg',
            frequency: '1 tablet twice daily (1-0-1)',
            duration: '3 days',
            instructions: 'Take after food for post-scaling sensitivity & swelling.'
          }
        ]
      }
    ],
    invoices: [
      {
        id: 'INV-2026-002',
        invoiceNumber: 'INV-2026-002',
        date: '2026-10-25',
        isFinalized: true,
        items: [
          { name: 'Full Mouth Ultrasonic Scaling & Polishing', fee: 2000, tooth: 'Full Mouth' },
          { name: 'Deep Subgingival Curettage & Root Planing (Lower Anterior)', fee: 1500, tooth: '31-41' }
        ],
        subtotal: 3500,
        discount: 200,
        taxPercent: 0,
        taxAmount: 0,
        total: 3300,
        paid: 3300,
        balance: 0,
        status: 'Paid',
        paymentMethod: 'Fonepay QR',
        doctorName: 'Dr. Anita Rayamajhi'
      }
    ],
    orders: [],
    imaging: [
      {
        id: 'XRAY-2026-002',
        title: 'Full Arch Digital Panoramic OPG (Periodontal Survey)',
        radiographType: 'Panoramic (OPG)',
        toothNumbers: ['Full Arch'],
        format: 'png',
        encounterId: 'APT-2026-002',
        uploadedAt: '2026-10-25T09:10:00.000Z',
        diagnosticImpression: 'Horizontal bone loss of 25-30% in lower anterior quadrant. Normal condyles.'
      }
    ]
  },
  {
    id: 'PT-1003',
    name: 'Rohan Shrestha',
    phone: '9812345678',
    email: 'rohan.shrestha@gmail.com',
    age: 24,
    gender: 'Male',
    bloodGroup: 'B+',
    address: 'Suryabinayak, Ward 5, Bhaktapur Municipality, Bagmati Province',
    province: 'Bagmati Province',
    district: 'Bhaktapur',
    municipality: 'Bhaktapur Municipality',
    ward: 'Ward 5',
    tole: 'Suryabinayak',
    emergencyContact: '9803344556 (Bina Shrestha - Mother)',
    allergies: ['Sulfa Drugs (Bactrim/Cotrimoxazole)'],
    medicalHistory: ['No systemic medical conditions'],
    advanceCreditBalance: 3000,
    createdAt: '2026-10-25T11:15:00.000Z',
    dentalChart: {
      '38': {
        toothId: '38',
        condition: 'impacted',
        surfaces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'healthy' },
        pocketDepth: { b: 5, l: 4, m: 4, d: 5 },
        mobility: 0,
        notes: 'Mesioangular impacted third molar causing acute pericoronitis'
      },
      '48': {
        toothId: '48',
        condition: 'sound',
        surfaces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'healthy' },
        pocketDepth: { b: 2, l: 2, m: 2, d: 2 },
        mobility: 0,
        notes: 'Erupted third molar'
      }
    },
    treatmentPlans: [
      { id: 'TP-1003-1', title: 'Surgical Disimpaction #38', status: 'Planned', estimatedCost: 6500 }
    ],
    notes: [
      {
        date: '2026-10-25',
        author: 'Dr. Mukesh Kushwaha',
        text: 'Severe pain, trismus, and swelling over lower left jaw. Erythematous operculum over #38. Treatment: Opercular debridement & medication.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2026-003',
        date: '2026-10-25',
        doctor: 'Dr. Mukesh Kushwaha',
        doctorId: 'DOC-1',
        diagnosis: 'Acute Pericoronitis #38 (Mesioangular Impacted)',
        reviewTimeline: 'In 5 days for surgical disimpaction assessment',
        isFinalized: true,
        instructions: 'Warm saline mouth rinses every 2 hours. Soft lukewarm diet. Ice compress externally 15 min on/off.',
        medicines: [
          {
            name: 'Augmentin 625mg',
            genericName: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
            dosage: '625 mg',
            frequency: '1 tablet twice daily (1-0-1)',
            duration: '5 days',
            instructions: 'Take strictly after meals. Complete full 5-day course.'
          },
          {
            name: 'Metrogyl 400mg',
            genericName: 'Metronidazole',
            dosage: '400 mg',
            frequency: '1 tablet thrice daily (1-1-1)',
            duration: '5 days',
            instructions: 'Take strictly after food. Strictly avoid alcohol during treatment.'
          },
          {
            name: 'Zerodol-SP',
            genericName: 'Aceclofenac + Paracetamol + Serratiopeptidase',
            dosage: '100/325/15 mg',
            frequency: '1 tablet twice daily (1-0-1)',
            duration: '3 days',
            instructions: 'Take after meals for severe pain and jaw swelling.'
          }
        ]
      }
    ],
    invoices: [
      {
        id: 'INV-2026-003',
        invoiceNumber: 'INV-2026-003',
        date: '2026-10-25',
        isFinalized: true,
        items: [
          { name: 'Emergency Opercular Debridement & Irrigation', fee: 1000, tooth: '38' },
          { name: 'OPG Panoramic X-Ray (Impacted 3rd Molar Survey)', fee: 1200, tooth: '38' }
        ],
        subtotal: 2200,
        discount: 0,
        taxPercent: 0,
        taxAmount: 0,
        total: 2200,
        paid: 2200,
        balance: 0,
        status: 'Paid',
        paymentMethod: 'Cash',
        doctorName: 'Dr. Mukesh Kushwaha'
      }
    ],
    orders: [],
    imaging: [
      {
        id: 'XRAY-2026-003',
        title: 'Panoramic Radiograph (OPG) - Mesioangular Impaction #38',
        radiographType: 'Panoramic (OPG)',
        toothNumbers: ['38'],
        format: 'png',
        encounterId: 'APT-2026-003',
        uploadedAt: '2026-10-25T11:40:00.000Z',
        diagnosticImpression: 'Mesioangular impaction of tooth #38 with crown abutting distal neck of #37. Pell & Gregory Class II, Position B.'
      }
    ]
  },
  {
    id: 'PT-1004',
    name: 'Pooja Thapa',
    phone: '9860123456',
    email: 'pooja.thapa@gmail.com',
    age: 28,
    gender: 'Female',
    bloodGroup: 'AB+',
    address: 'Jhamsikhel, Ward 2, Lalitpur, Bagmati Province',
    province: 'Bagmati Province',
    district: 'Lalitpur',
    municipality: 'Lalitpur Metropolitan City',
    ward: 'Ward 2',
    tole: 'Jhamsikhel',
    emergencyContact: '9841001122 (Karan Thapa - Husband)',
    allergies: [],
    medicalHistory: ['None reported'],
    advanceCreditBalance: 500,
    createdAt: '2026-10-26T10:00:00.000Z',
    dentalChart: {
      '11': {
        toothId: '11',
        condition: 'fracture',
        surfaces: { occlusal: 'healthy', mesial: 'composite_restoration', distal: 'healthy', buccal: 'healthy', lingual: 'healthy' },
        pocketDepth: { b: 2, l: 2, m: 2, d: 2 },
        mobility: 0,
        notes: 'Ellis Class II fracture restored with aesthetic nano-composite veneer'
      },
      '21': {
        toothId: '21',
        condition: 'sound',
        surfaces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'healthy' },
        pocketDepth: { b: 2, l: 2, m: 2, d: 2 },
        mobility: 0,
        notes: 'Healthy control incisor'
      }
    },
    treatmentPlans: [
      { id: 'TP-1004-1', title: 'Direct Aesthetic Composite Veneer #11', status: 'Completed', estimatedCost: 3500 }
    ],
    notes: [
      {
        date: '2026-10-26',
        author: 'Dr. Mukesh Kushwaha',
        text: 'Chipped upper front tooth (#11) after sports trauma. EPT test positive and normal. Treatment: Multi-shade layered nano-hybrid composite veneer.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2026-004',
        date: '2026-10-26',
        doctor: 'Dr. Mukesh Kushwaha',
        doctorId: 'DOC-1',
        diagnosis: 'Ellis Class II Crown Fracture #11',
        reviewTimeline: 'In 2 weeks for vitality check and polish',
        isFinalized: true,
        instructions: 'Avoid biting into hard foods (apples, carrots) directly with front teeth for 48 hours.',
        medicines: [
          {
            name: 'Dolo 650mg',
            genericName: 'Paracetamol',
            dosage: '650 mg',
            frequency: '1 tablet every 6 hours SOS',
            duration: '2 days',
            instructions: 'Take after food if any mild post-operative tooth sensitivity occurs.'
          }
        ]
      }
    ],
    invoices: [
      {
        id: 'INV-2026-004',
        invoiceNumber: 'INV-2026-004',
        date: '2026-10-26',
        isFinalized: true,
        items: [
          { name: 'Aesthetic Direct Nano-Composite Veneer (#11)', fee: 3500, tooth: '11' },
          { name: 'Digital Pre/Post Intraoral Radiograph', fee: 350, tooth: '11' }
        ],
        subtotal: 3850,
        discount: 350,
        taxPercent: 0,
        taxAmount: 0,
        total: 3500,
        paid: 3500,
        balance: 0,
        status: 'Paid',
        paymentMethod: 'Fonepay QR',
        doctorName: 'Dr. Mukesh Kushwaha'
      }
    ],
    orders: [],
    imaging: [
      {
        id: 'XRAY-2026-004',
        title: 'Digital IOPA Radiograph #11 (Trauma Assessment)',
        radiographType: 'Periapical (IOPA)',
        toothNumbers: ['11'],
        format: 'png',
        encounterId: 'APT-2026-004',
        uploadedAt: '2026-10-26T10:15:00.000Z',
        diagnosticImpression: 'Intact root with no fracture line. Lamina dura unbroken. Dentin thickness intact between fractured margin and pulp.'
      }
    ]
  },
  {
    id: 'PT-1005',
    name: 'Bikash Karki',
    phone: '9841887766',
    email: 'bikash.karki@yahoo.com',
    age: 52,
    gender: 'Male',
    bloodGroup: 'B+',
    address: 'Maharajgunj, Ward 3, Kathmandu, Bagmati Province',
    province: 'Bagmati Province',
    district: 'Kathmandu',
    municipality: 'Kathmandu Metropolitan City',
    ward: 'Ward 3',
    tole: 'Maharajgunj',
    emergencyContact: '9801443322 (Pratima Karki - Wife)',
    allergies: ['Aspirin', 'NSAIDs (Severe Gastric Irritation)'],
    medicalHistory: ['Type 2 Diabetes Mellitus (on Metformin 500mg BD)', 'Mild Osteoarthritis'],
    advanceCreditBalance: 2000,
    createdAt: '2026-10-27T08:00:00.000Z',
    dentalChart: {
      '46': {
        toothId: '46',
        condition: 'caries',
        surfaces: { occlusal: 'cavity_deep', mesial: 'healthy', distal: 'cavity_deep', buccal: 'healthy', lingual: 'healthy' },
        pocketDepth: { b: 4, l: 3, m: 4, d: 4 },
        mobility: 0,
        notes: 'Gross caries with necrotic pulp and apical radiolucency'
      },
      '47': {
        toothId: '47',
        condition: 'restoration',
        surfaces: { occlusal: 'filling_amalgam', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'healthy' },
        pocketDepth: { b: 2, l: 2, m: 2, d: 2 },
        mobility: 0,
        notes: 'Amalgam restoration intact'
      }
    },
    treatmentPlans: [
      { id: 'TP-1005-1', title: 'Molar Endodontic Therapy & Solid Zirconia Crown #46', status: 'In Progress', estimatedCost: 11000 }
    ],
    notes: [
      {
        date: '2026-10-27',
        author: 'Dr. Mukesh Kushwaha',
        text: 'Food lodgement and dull ache in lower right molar (#46). Diabetic control confirmed (Fasting BG 118 mg/dL). Plan: Rotary RCT + Crown.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-2026-005',
        date: '2026-10-27',
        doctor: 'Dr. Mukesh Kushwaha',
        doctorId: 'DOC-1',
        diagnosis: 'Chronic Apical Periodontitis with Pulp Necrosis #46',
        reviewTimeline: 'In 4 days for canal obturation',
        isFinalized: true,
        instructions: 'Avoid hard foods on right side. Maintain regular diabetes medications.',
        medicines: [
          {
            name: 'Amoxicillin 500mg',
            genericName: 'Amoxicillin Trihydrate',
            dosage: '500 mg',
            frequency: '1 capsule thrice daily (1-1-1)',
            duration: '5 days',
            instructions: 'Take after food. Complete course.'
          },
          {
            name: 'Paracetamol 650mg (Safe Alternative to NSAIDs)',
            genericName: 'Paracetamol',
            dosage: '650 mg',
            frequency: '1 tablet every 6 hours SOS',
            duration: '3 days',
            instructions: 'Take after food for post-op discomfort. Avoid NSAIDs due to allergy history.'
          },
          {
            name: 'Pantocid 40mg',
            genericName: 'Pantoprazole Sodium',
            dosage: '40 mg',
            frequency: '1 tablet once daily morning (1-0-0)',
            duration: '5 days',
            instructions: 'Take 30 mins before breakfast on empty stomach.'
          }
        ]
      }
    ],
    invoices: [
      {
        id: 'INV-2026-005',
        invoiceNumber: 'INV-2026-005',
        date: '2026-10-27',
        isFinalized: true,
        items: [
          { name: 'Rotary Endodontic Therapy - RCT Molar (#46)', fee: 6500, tooth: '46' },
          { name: 'Digital Working Length RVG X-Rays (2 shots)', fee: 600, tooth: '46' }
        ],
        subtotal: 7100,
        discount: 500,
        taxPercent: 0,
        taxAmount: 0,
        total: 6600,
        paid: 6600,
        balance: 0,
        status: 'Paid',
        paymentMethod: 'Fonepay QR',
        doctorName: 'Dr. Mukesh Kushwaha'
      }
    ],
    orders: [
      {
        id: 'ORD-2026-005',
        patientId: 'PT-1005',
        patientName: 'Bikash Karki',
        patientPhone: '9841887766',
        orderType: 'Crown',
        toothOrImplantDetails: 'Tooth #46',
        clinicalSpecifications: 'Full Contour Zirconia Crown, Shade VITA A3, Heavy Occlusal Clearance',
        materials: 'BruxZir Solid Zirconia',
        assignedStaffOrLab: 'Kathmandu Dental Milling Lab',
        orderDate: '2026-10-27T09:30:00.000Z',
        expectedCompletionDate: '2026-11-01T14:00:00.000Z',
        cost: 4500,
        paymentStatus: 'Paid',
        progressStatus: 'Pending',
        notes: [
          { author: 'Dr. Mukesh Kushwaha', text: 'Patient has strong masseter muscles; ensure high fracture resistance.', date: '2026-10-27T09:40:00.000Z' }
        ]
      }
    ],
    imaging: [
      {
        id: 'XRAY-2026-005',
        title: 'Digital IOPA Radiograph #46 (Working Length)',
        radiographType: 'Periapical (IOPA)',
        toothNumbers: ['46'],
        format: 'png',
        encounterId: 'APT-2026-005',
        uploadedAt: '2026-10-27T08:30:00.000Z',
        diagnosticImpression: 'Distal canal working length: 20mm. Mesiobuccal: 19.5mm. Mesiolingual: 19.5mm. Radiolucency at distal apex.'
      }
    ]
  }
];

const newAppointments = [
  {
    id: 'APT-2026-001',
    status: 'Confirmed',
    createdAt: '2026-10-26T10:00:00.000Z',
    patientId: 'PT-1001',
    patientName: 'Aarav Sharma',
    patientPhone: '+977 98412 34567',
    doctorName: 'Dr. Mukesh Kushwaha',
    chair: 'Chair 1 (Main Operatory)',
    date: '2026-10-28',
    time: '10:00 AM',
    durationMinutes: 45,
    treatmentType: 'Root Canal Therapy (RCT Sitting 1) #16',
    notes: 'Penicillin allergy noted. Patient requested profound local anaesthesia.'
  },
  {
    id: 'APT-2026-002',
    status: 'Confirmed',
    createdAt: '2026-10-26T11:00:00.000Z',
    patientId: 'PT-1002',
    patientName: 'Sunita Adhikari',
    patientPhone: '+977 98511 22334',
    doctorName: 'Dr. Anita Rayamajhi',
    chair: 'Chair 2 (Orthodontic & Hygiene)',
    date: '2026-10-28',
    time: '11:30 AM',
    durationMinutes: 30,
    treatmentType: 'Root Planing Re-Evaluation & Polish',
    notes: 'Check bleeding on probing indices post-scaling'
  },
  {
    id: 'APT-2026-003',
    status: 'Confirmed',
    createdAt: '2026-10-26T12:00:00.000Z',
    patientId: 'PT-1003',
    patientName: 'Rohan Shrestha',
    patientPhone: '+977 98123 45678',
    doctorName: 'Dr. Mukesh Kushwaha',
    chair: 'Chair 1 (Main Operatory)',
    date: '2026-10-28',
    time: '02:00 PM',
    durationMinutes: 60,
    treatmentType: 'Surgical Disimpaction #38',
    notes: 'Informed consent signed for lower third molar surgical extraction'
  },
  {
    id: 'APT-2026-004',
    status: 'Confirmed',
    createdAt: '2026-10-26T13:00:00.000Z',
    patientId: 'PT-1004',
    patientName: 'Pooja Thapa',
    patientPhone: '+977 98601 23456',
    doctorName: 'Dr. Mukesh Kushwaha',
    chair: 'Chair 2 (Orthodontic & Hygiene)',
    date: '2026-10-29',
    time: '09:30 AM',
    durationMinutes: 30,
    treatmentType: 'Aesthetic Polish & Vitality Follow-Up #11',
    notes: 'Review incisal edge contour under natural daylight'
  },
  {
    id: 'APT-2026-005',
    status: 'Confirmed',
    createdAt: '2026-10-26T14:00:00.000Z',
    patientId: 'PT-1005',
    patientName: 'Bikash Karki',
    patientPhone: '+977 98418 87766',
    doctorName: 'Dr. Mukesh Kushwaha',
    chair: 'Chair 1 (Main Operatory)',
    date: '2026-10-29',
    time: '11:00 AM',
    durationMinutes: 45,
    treatmentType: 'Canal Obturation & Temp Seal #46',
    notes: 'Diabetic patient. NSAID allergy - paracetamol only.'
  }
];

const newXrays = [
  {
    id: 'XRAY-2026-001',
    patientId: 'PT-1001',
    patientName: 'Aarav Sharma',
    patientPhone: '9841234567',
    encounterId: 'APT-2026-001',
    title: 'Diagnostic Intraoral Periapical (IOPA) #16 & #17',
    radiographType: 'Periapical (IOPA)',
    toothNumbers: ['16', '17'],
    fileName: 'iopa_16_pt1001.png',
    fileSize: 3200,
    format: 'png',
    mimeType: 'image/svg+xml',
    clinicalNotes: 'Pre-operative assessment of pulp chamber and root canal anatomy.',
    diagnosticImpression: 'Deep disto-occlusal radiolucency approaching mesiobuccal pulp horn #16. Widened PDL space at root apex.',
    uploadedBy: 'Dr. Mukesh Kushwaha',
    uploadedByRole: 'DOCTOR',
    uploadedAt: '2026-10-24T10:15:00.000Z'
  },
  {
    id: 'XRAY-2026-002',
    patientId: 'PT-1002',
    patientName: 'Sunita Adhikari',
    patientPhone: '9851122334',
    encounterId: 'APT-2026-002',
    title: 'Full Arch Digital Panoramic OPG (Periodontal Survey)',
    radiographType: 'Panoramic (OPG)',
    toothNumbers: ['Full Arch'],
    fileName: 'opg_pt1002.png',
    fileSize: 4500,
    format: 'png',
    mimeType: 'image/svg+xml',
    clinicalNotes: 'Full mouth periodontal screening.',
    diagnosticImpression: 'Generalized horizontal bone loss of 25-30% in lower anterior quadrant. Normal condyles.',
    uploadedBy: 'Dr. Anita Rayamajhi',
    uploadedByRole: 'DOCTOR',
    uploadedAt: '2026-10-25T09:10:00.000Z'
  },
  {
    id: 'XRAY-2026-003',
    patientId: 'PT-1003',
    patientName: 'Rohan Shrestha',
    patientPhone: '9812345678',
    encounterId: 'APT-2026-003',
    title: 'Panoramic Radiograph (OPG) - Mesioangular Impaction #38',
    radiographType: 'Panoramic (OPG)',
    toothNumbers: ['38'],
    fileName: 'opg_38_pt1003.png',
    fileSize: 4800,
    format: 'png',
    mimeType: 'image/svg+xml',
    clinicalNotes: 'Pre-surgical impaction evaluation.',
    diagnosticImpression: 'Mesioangular impaction of tooth #38 abutting distal neck of #37. Pell & Gregory Class II, Position B.',
    uploadedBy: 'Dr. Mukesh Kushwaha',
    uploadedByRole: 'DOCTOR',
    uploadedAt: '2026-10-25T11:40:00.000Z'
  },
  {
    id: 'XRAY-2026-004',
    patientId: 'PT-1004',
    patientName: 'Pooja Thapa',
    patientPhone: '9860123456',
    encounterId: 'APT-2026-004',
    title: 'Digital IOPA Radiograph #11 (Trauma Assessment)',
    radiographType: 'Periapical (IOPA)',
    toothNumbers: ['11'],
    fileName: 'iopa_11_pt1004.png',
    fileSize: 2800,
    format: 'png',
    mimeType: 'image/svg+xml',
    clinicalNotes: 'Post-trauma crown fracture evaluation.',
    diagnosticImpression: 'Intact root with no fracture line. Lamina dura unbroken. Dentin thickness intact between fractured margin and pulp.',
    uploadedBy: 'Dr. Mukesh Kushwaha',
    uploadedByRole: 'DOCTOR',
    uploadedAt: '2026-10-26T10:15:00.000Z'
  },
  {
    id: 'XRAY-2026-005',
    patientId: 'PT-1005',
    patientName: 'Bikash Karki',
    patientPhone: '9841887766',
    encounterId: 'APT-2026-005',
    title: 'Digital IOPA Radiograph #46 (Working Length)',
    radiographType: 'Periapical (IOPA)',
    toothNumbers: ['46'],
    fileName: 'iopa_46_pt1005.png',
    fileSize: 3100,
    format: 'png',
    mimeType: 'image/svg+xml',
    clinicalNotes: 'Working length measurement and apical lesion survey.',
    diagnosticImpression: 'Distal canal working length: 20mm. Mesiobuccal: 19.5mm. Mesiolingual: 19.5mm. Radiolucency at distal apex.',
    uploadedBy: 'Dr. Mukesh Kushwaha',
    uploadedByRole: 'DOCTOR',
    uploadedAt: '2026-10-27T08:30:00.000Z'
  }
];

// Execute seed
function seedDatabase() {
  const data = JSON.parse(fs.readFileSync(TENANT_FILE, 'utf-8'));

  // Erase old patient records & insert the 5 new ones
  data.patients = newPatients;
  data.appointments = newAppointments;
  data.xrays = newXrays;

  // Filter finance transactions to match new patients
  const patientTxns = newPatients.map((p, idx) => ({
    id: `TXN-2026-00${idx + 1}`,
    date: p.invoices[0].date,
    refNumber: p.invoices[0].invoiceNumber,
    payerOrRecipient: p.name,
    type: 'INCOME',
    category: 'Patient Treatment',
    amount: p.invoices[0].paid,
    paymentMethod: p.invoices[0].paymentMethod,
    status: 'Completed',
    relatedPatientId: p.id,
    relatedStaffId: null,
    notes: `Invoice settlement for ${p.invoices[0].invoiceNumber}`,
    createdBy: 'Dr. Mukesh Kushwaha (Lead Surgeon)',
    createdAt: `${p.invoices[0].date}T12:00:00.000Z`
  }));

  // Preserve clinic operational expense transactions but reset patient income
  const otherTxns = (data.financeTransactions || []).filter(t => !t.relatedPatientId);
  data.financeTransactions = [...patientTxns, ...otherTxns];

  // Save updated tenant file
  fs.writeFileSync(TENANT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Successfully seeded ${newPatients.length} new patients, ${newAppointments.length} appointments, and ${newXrays.length} radiographs into ${TENANT_FILE}`);
}

seedDatabase();
