import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFivePatients(doctorName = 'Dr. Mukesh Kushwaha') {
  return [
    {
      id: 'PT-1001',
      name: 'Aarav Sharma',
      phone: '9841234567',
      email: 'aarav.sharma@gmail.com',
      age: 32,
      gender: 'Male',
      bloodGroup: 'O+',
      province: 'Bagmati Province',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan City',
      ward: 'Ward 10',
      tole: 'New Baneshwor',
      address: 'Ward 10, New Baneshwor, Kathmandu Metropolitan City, Kathmandu, Bagmati Province',
      emergencyContact: '9801987654',
      allergies: ['Penicillin (Urticaria/Rash)'],
      medicalHistory: ['Mild Bronchial Asthma', 'Occasional Acid Reflux (GERD)'],
      advanceCreditBalance: 0,
      lastTicketDate: '2026-10-29',
      ticketValidUntil: '2026-11-05',
      ticketStatus: 'ACTIVE',
      revisitsLeft: 1,
      dentalChart: {
        '16': {
          condition: 'root_canal',
          surfaces: { occlusal: 'cavity_deep', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'healthy' },
          pocketDepth: { b: 3, l: 3, m: 3, d: 3 },
          mobility: 0,
          notes: 'Working length determined: MB 21mm, DB 20.5mm, Palatal 22mm. Biomechanical prep completed.'
        },
        '26': {
          condition: 'composite_restoration',
          surfaces: { occlusal: 'filling_sound' },
          notes: 'Class I aesthetic composite restoration placed.'
        },
        '36': {
          condition: 'caries',
          surfaces: { occlusal: 'cavity_moderate' },
          notes: 'Deep dentinal caries on occlusal surface. Restorative therapy advised.'
        },
        '46': {
          condition: 'healthy',
          notes: 'Sound tooth structure, no intervention needed.'
        }
      },
      treatmentPlans: [
        {
          id: 'PLAN-101',
          title: 'Root Canal Treatment & Ceramic Crown #16',
          status: 'In Progress',
          estimatedCost: 12000,
          paidAmount: 12000,
          notes: 'Complete endodontic therapy with fiber post, core build-up and monolithic zirconia crown.',
          createdAt: '2026-10-29T09:30:00.000Z'
        }
      ],
      notes: [
        {
          id: 'NOTE-101',
          date: '2026-10-29',
          time: '10:00 AM',
          author: doctorName,
          authorRole: 'Lead Dental Surgeon',
          text: 'Chief Complaint: Severe nocturnal throbbing pain in upper right molar. Clinical exam reveals deep occlusal pulp exposure on tooth #16 with severe lingering thermal sensitivity. Diagnosis: Acute Irreversible Pulpitis #16.'
        }
      ],
      prescriptions: [
        {
          id: 'RX-101',
          date: '2026-10-29',
          time: '10:15 AM',
          doctor: doctorName,
          diagnosis: 'Acute Irreversible Pulpitis #16 - Post-Op Obturation Pain Management',
          instructions: 'Take medications strictly after meals. Rinse with warm salt water.',
          reviewTimeline: '3 days',
          medicines: [
            {
              name: 'Ketorolac 10mg (Ketorol-DT)',
              genericName: 'Ketorolac Tromethamine',
              dosage: '10 mg',
              frequency: '1 tablet PRN for severe pain (max 3/day)',
              duration: '2 days',
              instructions: 'Dissolve in half glass water'
            },
            {
              name: 'Cefixime 200mg (Cef-O)',
              genericName: 'Cefixime',
              dosage: '200 mg',
              frequency: '1 tablet BD',
              duration: '5 days',
              instructions: 'Take after meals'
            },
            {
              name: 'Pantoprazole 40mg (Pantocid)',
              genericName: 'Pantoprazole',
              dosage: '40 mg',
              frequency: '1 tablet OD',
              duration: '5 days',
              instructions: 'Take before breakfast'
            }
          ],
          isFinalized: true
        }
      ],
      invoices: [
        {
          id: 'INV-1001',
          invoiceNumber: 'INV-2026-1231',
          date: '2026-10-29',
          time: '10:15 AM',
          createdAt: '2026-10-29T10:15:00.000Z',
          total: 2000,
          paid: 1000,
          balance: 1000,
          status: 'Partial',
          paymentMethod: 'Fonepay QR',
          receiptNumber: 'RCP-2026-10011',
          doctorName: doctorName,
          items: [
            {
              description: 'Registration & OPD Consultation Fee',
              tooth: 'General Consultation',
              qty: 1,
              unitPrice: 200,
              total: 200,
              paidAmount: 200,
              remainingAmount: 0,
              isTicket: true,
              ticketStatus: 'FIRST_VISIT'
            },
            {
              description: 'Root Canal Therapy Sitting 1 (Access Opening & Canal Prep)',
              tooth: 'Tooth #16',
              qty: 1,
              unitPrice: 1800,
              total: 1800,
              paidAmount: 800,
              remainingAmount: 1000
            }
          ]
        }
      ],
      orders: [
        {
          id: 'ORD-2026-001',
          orderNumber: 'ORD-2026-001',
          patientId: 'PT-1001',
          patientName: 'Aarav Sharma',
          orderType: 'Crown',
          toothOrImplantDetails: 'Tooth #16',
          assignedStaffOrLab: 'Kathmandu Dental Milling Lab',
          labName: 'Kathmandu Dental Milling Lab',
          clinicalSpecifications: 'Solid Zirconia Monolithic Crown with anatomic contours',
          materials: 'Solid Zirconia Monolithic',
          shade: 'A2',
          expectedCompletionDate: '2026-11-03T12:00:00.000Z',
          cost: 3500,
          paidAmount: 3500,
          balanceDue: 0,
          paymentStatus: 'Paid',
          progressStatus: 'In Progress',
          status: 'In Progress',
          orderDate: '2026-10-29',
          expectedDate: '2026-11-03'
        },
        {
          id: 'ORD-2026-006',
          orderNumber: 'ORD-2026-006',
          patientId: 'PT-1001',
          patientName: 'Aarav Sharma',
          orderType: 'Custom Night Guard',
          toothOrImplantDetails: 'Maxillary Arch',
          clinicalSpecifications: 'Dual laminate hard/soft occlusal splint for nocturnal bruxism',
          materials: 'Dual Laminate Polymer',
          assignedStaffOrLab: 'DentCraft Nepal Labs',
          labName: 'DentCraft Nepal Labs',
          expectedCompletionDate: '2026-11-02T12:00:00.000Z',
          cost: 2500,
          paidAmount: 2500,
          balanceDue: 0,
          paymentStatus: 'Paid',
          progressStatus: 'Delivered',
          status: 'Delivered',
          orderDate: '2026-10-29',
          expectedDate: '2026-11-02'
        }
      ],
      imaging: [
        {
          id: 'XRAY-2026-001',
          title: 'Digital IOPA Radiograph #16 (Pre-Op)',
          radiographType: 'Periapical (IOPA)',
          toothNumber: '16',
          date: '2026-10-29',
          clinicalNotes: 'Diagnostic Intraoral Periapical (IOPA) #16 & #17',
          findings: 'Periapical periodontitis',
          url: '/images/iopa_default.png',
          uploadedAt: '2026-10-29T10:05:00.000Z'
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
      province: 'Bagmati Province',
      district: 'Lalitpur',
      municipality: 'Lalitpur Metropolitan City',
      ward: 'Ward 3',
      tole: 'Pulchowk',
      address: 'Ward 3, Pulchowk, Lalitpur Metropolitan City, Lalitpur, Bagmati Province',
      emergencyContact: '9841998877',
      allergies: [],
      medicalHistory: ['Hypertension (on Losartan 50mg OD)', 'Hypothyroidism (on Thyronorm 50mcg OD)'],
      advanceCreditBalance: 0,
      lastTicketDate: '2026-10-29',
      ticketValidUntil: '2026-11-05',
      ticketStatus: 'ACTIVE',
      revisitsLeft: 1,
      dentalChart: {
        '24': {
          condition: 'cervical_abrasion',
          surfaces: { buccal: 'cervical_defect' },
          notes: 'Wedge-shaped cervical defect with dentin sensitivity to cold stimuli.'
        },
        '31': {
          condition: 'periodontal_pocket',
          pocketDepth: { b: 4, l: 4, m: 4, d: 4 },
          notes: '4mm pocket depth with bleeding on probing.'
        },
        '41': {
          condition: 'periodontal_pocket',
          pocketDepth: { b: 4.5, l: 4, m: 4.5, d: 4 },
          notes: '4.5mm pocket depth with moderate subgingival calculus.'
        }
      },
      treatmentPlans: [
        {
          id: 'PLAN-102',
          title: 'Periodontal Therapy & Scaling',
          status: 'Completed',
          estimatedCost: 3300,
          paidAmount: 3300,
          notes: 'Full mouth ultrasonic subgingival debridement and plaque control.',
          createdAt: '2026-10-29T10:00:00.000Z'
        }
      ],
      notes: [
        {
          id: 'NOTE-102',
          date: '2026-10-29',
          time: '11:00 AM',
          author: doctorName,
          authorRole: 'Lead Dental Surgeon',
          text: 'Chief Complaint: Bleeding gums while brushing and mobility of lower front teeth. Generalized subgingival and supragingival calculus present. Stage II Periodontitis.'
        }
      ],
      prescriptions: [
        {
          id: 'RX-102',
          date: '2026-10-29',
          time: '11:30 AM',
          doctor: doctorName,
          diagnosis: 'Chronic Generalized Periodontitis & Cervical Caries #24',
          instructions: 'Rinse twice daily for 2 weeks. Do not eat or drink for 30 minutes after rinsing.',
          reviewTimeline: '14 days',
          medicines: [
            {
              name: 'Amoxicillin 500mg',
              dosage: '500 mg',
              frequency: '1 capsule TID',
              duration: '5 days',
              instructions: 'Take after meals'
            },
            {
              name: 'Metronidazole 400mg',
              dosage: '400 mg',
              frequency: '1 tablet TID',
              duration: '5 days',
              instructions: 'Avoid alcohol completely'
            },
            {
              name: 'Chlorhexidine 0.2% Mouthwash',
              dosage: '10 ml',
              frequency: 'Rinse BD',
              duration: '14 days',
              instructions: 'Rinse for 1 minute'
            }
          ],
          isFinalized: true
        }
      ],
      invoices: [
        {
          id: 'INV-1002',
          invoiceNumber: 'INV-2026-002',
          date: '2026-10-29',
          time: '11:30 AM',
          createdAt: '2026-10-29T11:30:00.000Z',
          total: 3300,
          paid: 3300,
          balance: 0,
          status: 'Paid',
          paymentMethod: 'Fonepay QR',
          receiptNumber: 'RCP-2026-10012',
          doctorName: doctorName,
          items: [
            {
              description: 'Registration & OPD Consultation Fee',
              tooth: 'General Consultation',
              qty: 1,
              unitPrice: 200,
              total: 200,
              paidAmount: 200,
              remainingAmount: 0,
              isTicket: true
            },
            {
              description: 'Full Mouth Ultrasonic Scaling & Polish',
              tooth: 'Full Mouth',
              qty: 1,
              unitPrice: 2000,
              total: 2000,
              paidAmount: 2000,
              remainingAmount: 0
            },
            {
              description: 'Glass Ionomer Cervical Restoration #24',
              tooth: 'Tooth #24',
              qty: 1,
              unitPrice: 1100,
              total: 1100,
              paidAmount: 1100,
              remainingAmount: 0
            }
          ]
        }
      ],
      orders: [
        {
          id: 'ORD-2026-002',
          orderNumber: 'ORD-2026-002',
          patientId: 'PT-1002',
          patientName: 'Sunita Adhikari',
          orderType: 'Crown',
          toothOrImplantDetails: 'Tooth #24',
          assignedStaffOrLab: 'Kathmandu Dental Milling Lab',
          labName: 'Kathmandu Dental Milling Lab',
          clinicalSpecifications: 'E-Max Ceramic Inlay/Onlay with natural translucency',
          materials: 'E-Max Ceramic Inlay/Onlay',
          shade: 'A3',
          expectedCompletionDate: '2026-11-02T12:00:00.000Z',
          cost: 3000,
          paidAmount: 3000,
          balanceDue: 0,
          paymentStatus: 'Paid',
          progressStatus: 'Completed',
          status: 'Completed',
          orderDate: '2026-10-29',
          expectedDate: '2026-11-02'
        }
      ],
      imaging: [
        {
          id: 'XRAY-2026-002',
          title: 'Full Arch Digital Panoramic OPG (Periodontal Survey)',
          radiographType: 'Panoramic (OPG)',
          toothNumber: 'Full Arch',
          date: '2026-10-29',
          clinicalNotes: 'Periodontal Survey showing generalized horizontal alveolar crest reduction.',
          findings: 'Moderate chronic periodontitis',
          url: '/images/opg_default.png',
          uploadedAt: '2026-10-29T11:10:00.000Z'
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
      province: 'Bagmati Province',
      district: 'Bhaktapur',
      municipality: 'Bhaktapur Municipality',
      ward: 'Ward 5',
      tole: 'Suryabinayak',
      address: 'Ward 5, Suryabinayak, Bhaktapur Municipality, Bhaktapur, Bagmati Province',
      emergencyContact: '9803344556',
      allergies: ['Sulfa Drugs (Bactrim/Cotrimoxazole)'],
      medicalHistory: ['No systemic medical conditions'],
      advanceCreditBalance: 0,
      lastTicketDate: '2026-10-29',
      ticketValidUntil: '2026-11-05',
      ticketStatus: 'ACTIVE',
      revisitsLeft: 1,
      dentalChart: {
        '38': {
          condition: 'impacted',
          notes: 'Mesioangular impaction with inflamed operculum.'
        },
        '48': {
          condition: 'impacted',
          notes: 'Vertical impaction, asymptomatic.'
        }
      },
      treatmentPlans: [
        {
          id: 'PLAN-103',
          title: 'Surgical Disimpaction #38',
          status: 'Planned',
          estimatedCost: 2200,
          paidAmount: 2200,
          notes: 'Surgical transalveolar extraction of impacted lower left third molar.',
          createdAt: '2026-10-29T11:00:00.000Z'
        }
      ],
      notes: [
        {
          id: 'NOTE-103',
          date: '2026-10-29',
          time: '01:00 PM',
          author: doctorName,
          authorRole: 'Oral Surgeon',
          text: 'Severe pain, trismus, and swelling over lower left jaw. Erythematous operculum over partially erupted #38. Diagnosis: Acute Pericoronitis #38.'
        }
      ],
      prescriptions: [
        {
          id: 'RX-103',
          date: '2026-10-29',
          time: '01:15 PM',
          doctor: doctorName,
          diagnosis: 'Acute Pericoronitis #38 (Mesioangular Impacted)',
          instructions: 'Take medications with food. Apply cold compress externally for 20 minutes every hour.',
          reviewTimeline: '5 days',
          medicines: [
            {
              name: 'Augmentin 625mg',
              dosage: '625 mg',
              frequency: '1 tablet BD',
              duration: '5 days',
              instructions: 'Take after meals'
            },
            {
              name: 'Aceclofenac + Paracetamol (Zerodol-P)',
              dosage: '100mg/325mg',
              frequency: '1 tablet BD',
              duration: '3 days',
              instructions: 'Take after food'
            },
            {
              name: 'Povidone Iodine 1% Oral Gargle',
              dosage: '15 ml',
              frequency: 'Gargle TID',
              duration: '5 days',
              instructions: 'Do not swallow'
            }
          ],
          isFinalized: true
        }
      ],
      invoices: [
        {
          id: 'INV-1003',
          invoiceNumber: 'INV-2026-003',
          date: '2026-10-29',
          time: '01:15 PM',
          createdAt: '2026-10-29T13:15:00.000Z',
          total: 2200,
          paid: 2200,
          balance: 0,
          status: 'Paid',
          paymentMethod: 'Cash',
          receiptNumber: 'RCP-2026-10013',
          doctorName: doctorName,
          items: [
            {
              description: 'Registration & OPD Consultation Fee',
              tooth: 'General Consultation',
              qty: 1,
              unitPrice: 200,
              total: 200,
              paidAmount: 200,
              remainingAmount: 0,
              isTicket: true
            },
            {
              description: 'Emergency Operculectomy & Antiseptic Irrigation #38',
              tooth: 'Tooth #38',
              qty: 1,
              unitPrice: 2000,
              total: 2000,
              paidAmount: 2000,
              remainingAmount: 0
            }
          ]
        }
      ],
      orders: [
        {
          id: 'ORD-2026-003',
          orderNumber: 'ORD-2026-003',
          patientId: 'PT-1003',
          patientName: 'Rohan Shrestha',
          orderType: 'Splint',
          toothOrImplantDetails: 'Full Arch',
          assignedStaffOrLab: 'DentCraft Nepal Labs',
          labName: 'DentCraft Nepal Labs',
          clinicalSpecifications: 'Hard/Soft Dual Laminate Night Guard for bruxism prevention',
          materials: 'Hard/Soft Dual Laminate Night Guard',
          shade: 'Clear',
          expectedCompletionDate: '2026-11-01T12:00:00.000Z',
          cost: 2200,
          paidAmount: 2200,
          balanceDue: 0,
          paymentStatus: 'Paid',
          progressStatus: 'Delivered',
          status: 'Delivered',
          orderDate: '2026-10-29',
          expectedDate: '2026-11-01'
        }
      ],
      imaging: [
        {
          id: 'XRAY-2026-003',
          title: 'Panoramic Radiograph (OPG) - Mesioangular Impaction #38',
          radiographType: 'Panoramic (OPG)',
          toothNumber: 'Full Arch',
          date: '2026-10-29',
          clinicalNotes: 'Tooth #38 mesioangularly impacted against distal contour of #37.',
          findings: 'Mesioangular impaction #38',
          url: '/images/opg_default.png',
          uploadedAt: '2026-10-29T13:05:00.000Z'
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
      province: 'Bagmati Province',
      district: 'Lalitpur',
      municipality: 'Lalitpur Metropolitan City',
      ward: 'Ward 2',
      tole: 'Jhamsikhel',
      address: 'Ward 2, Jhamsikhel, Lalitpur Metropolitan City, Lalitpur, Bagmati Province',
      emergencyContact: '9841001122',
      allergies: [],
      medicalHistory: [],
      advanceCreditBalance: 0,
      lastTicketDate: '2026-10-29',
      ticketValidUntil: '2026-11-05',
      ticketStatus: 'ACTIVE',
      revisitsLeft: 1,
      dentalChart: {
        '11': {
          condition: 'composite_veneer',
          surfaces: { facial: 'restoration_sound' },
          notes: 'Aesthetic direct composite veneer placed after incisal fracture.'
        },
        '21': {
          condition: 'composite_veneer',
          surfaces: { facial: 'restoration_sound' },
          notes: 'Matching aesthetic composite veneer placed.'
        }
      },
      treatmentPlans: [
        {
          id: 'PLAN-104',
          title: 'Direct Aesthetic Composite Veneer #11',
          status: 'Completed',
          estimatedCost: 3500,
          paidAmount: 3500,
          notes: 'Direct aesthetic composite veneer and incisal reconstruction #11.',
          createdAt: '2026-10-29T12:00:00.000Z'
        }
      ],
      notes: [
        {
          id: 'NOTE-104',
          date: '2026-10-29',
          time: '02:00 PM',
          author: doctorName,
          authorRole: 'Cosmetic Dentist',
          text: 'Chipped upper front tooth (#11) after sports trauma. EPT test positive and vital. Direct composite layering with multi-shade nanofill composite completed.'
        }
      ],
      prescriptions: [
        {
          id: 'RX-104',
          date: '2026-10-29',
          time: '02:30 PM',
          doctor: doctorName,
          diagnosis: 'Ellis Class II Crown Fracture #11',
          instructions: 'Avoid biting hard food on front teeth for 48 hours. Maintain gentle brushing.',
          reviewTimeline: '7 days',
          medicines: [
            {
              name: 'Ibuprofen 400mg',
              dosage: '400 mg',
              frequency: '1 tablet PRN',
              duration: '2 days',
              instructions: 'Take after meals if sensitive'
            }
          ],
          isFinalized: true
        }
      ],
      invoices: [
        {
          id: 'INV-1004',
          invoiceNumber: 'INV-2026-004',
          date: '2026-10-29',
          time: '02:30 PM',
          createdAt: '2026-10-29T14:30:00.000Z',
          total: 3500,
          paid: 3500,
          balance: 0,
          status: 'Paid',
          paymentMethod: 'Fonepay QR',
          receiptNumber: 'RCP-2026-10014',
          doctorName: doctorName,
          items: [
            {
              description: 'Registration & OPD Consultation Fee',
              tooth: 'General Consultation',
              qty: 1,
              unitPrice: 200,
              total: 200,
              paidAmount: 200,
              remainingAmount: 0,
              isTicket: true
            },
            {
              description: 'Direct Aesthetic Composite Veneer #11',
              tooth: 'Tooth #11',
              qty: 1,
              unitPrice: 3300,
              total: 3300,
              paidAmount: 3300,
              remainingAmount: 0
            }
          ]
        }
      ],
      orders: [
        {
          id: 'ORD-2026-004',
          orderNumber: 'ORD-2026-004',
          patientId: 'PT-1004',
          patientName: 'Pooja Thapa',
          orderType: 'Crown',
          toothOrImplantDetails: 'Tooth #11',
          assignedStaffOrLab: 'Kathmandu Dental Milling Lab',
          labName: 'Kathmandu Dental Milling Lab',
          clinicalSpecifications: 'Lithium Disilicate Anterior Aesthetic Veneer #11',
          materials: 'Lithium Disilicate Veneer',
          shade: 'B1',
          expectedCompletionDate: '2026-11-04T12:00:00.000Z',
          cost: 3000,
          paidAmount: 3000,
          balanceDue: 0,
          paymentStatus: 'Paid',
          progressStatus: 'Requested',
          status: 'Requested',
          orderDate: '2026-10-29',
          expectedDate: '2026-11-04'
        }
      ],
      imaging: [
        {
          id: 'XRAY-2026-004',
          title: 'Digital IOPA Radiograph #11 (Trauma Assessment)',
          radiographType: 'Periapical (IOPA)',
          toothNumber: '11',
          date: '2026-10-29',
          clinicalNotes: 'Trauma Assessment: Intact lamina dura and PDL space.',
          findings: 'Ellis Class II Fracture',
          url: '/images/iopa_default.png',
          uploadedAt: '2026-10-29T14:15:00.000Z'
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
      province: 'Bagmati Province',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan City',
      ward: 'Ward 3',
      tole: 'Maharajgunj',
      address: 'Ward 3, Maharajgunj, Kathmandu Metropolitan City, Kathmandu, Bagmati Province',
      emergencyContact: '9801443322',
      allergies: ['Aspirin, NSAIDs (Severe Gastric Irritation)'],
      medicalHistory: ['Type 2 Diabetes Mellitus (on Metformin 500mg BD)', 'Mild Osteoarthritis'],
      advanceCreditBalance: 0,
      lastTicketDate: '2026-10-29',
      ticketValidUntil: '2026-11-05',
      ticketStatus: 'ACTIVE',
      revisitsLeft: 1,
      dentalChart: {
        '46': {
          condition: 'root_canal',
          surfaces: { occlusal: 'cavity_deep' },
          notes: 'Necrotic pulp obturated. Distal canal 20mm, mesial canals 19.5mm. Ready for permanent zirconia crown.'
        },
        '47': {
          condition: 'crown',
          notes: 'Full contour zirconia crown on second molar, functioning well.'
        }
      },
      treatmentPlans: [
        {
          id: 'PLAN-105',
          title: 'Molar Endodontic Therapy & Solid Zirconia Crown #46',
          status: 'In Progress',
          estimatedCost: 6600,
          paidAmount: 6600,
          notes: 'Root canal therapy and monolithic zirconia crown placement #46.',
          createdAt: '2026-10-29T14:00:00.000Z'
        }
      ],
      notes: [
        {
          id: 'NOTE-105',
          date: '2026-10-29',
          time: '04:00 PM',
          author: doctorName,
          authorRole: 'Lead Dental Surgeon',
          text: 'Food lodgement and dull ache in lower right molar (#46). Diabetic patient under glycemic control (HbA1c: 6.8%). Biomechanical prep completed.'
        }
      ],
      prescriptions: [
        {
          id: 'RX-105',
          date: '2026-10-29',
          time: '04:15 PM',
          doctor: doctorName,
          diagnosis: 'Chronic Apical Periodontitis with Pulp Necrosis #46',
          instructions: 'Take medicines on time. Maintain good oral hygiene.',
          reviewTimeline: '7 days',
          medicines: [
            {
              name: 'Cefixime 200mg',
              dosage: '200 mg',
              frequency: '1 tablet BD',
              duration: '5 days',
              instructions: 'Take after meals'
            },
            {
              name: 'Paracetamol 650mg',
              dosage: '650 mg',
              frequency: '1 tablet TID',
              duration: '3 days',
              instructions: 'For pain relief'
            },
            {
              name: 'Pantoprazole 40mg',
              dosage: '40 mg',
              frequency: '1 tablet OD',
              duration: '5 days',
              instructions: 'Take before breakfast'
            }
          ],
          isFinalized: true
        }
      ],
      invoices: [
        {
          id: 'INV-1005',
          invoiceNumber: 'INV-2026-005',
          date: '2026-10-29',
          time: '04:15 PM',
          createdAt: '2026-10-29T16:15:00.000Z',
          total: 6600,
          paid: 6600,
          balance: 0,
          status: 'Paid',
          paymentMethod: 'Fonepay QR',
          receiptNumber: 'RCP-2026-10015',
          doctorName: doctorName,
          items: [
            {
              description: 'Registration & OPD Consultation Fee',
              tooth: 'General Consultation',
              qty: 1,
              unitPrice: 200,
              total: 200,
              paidAmount: 200,
              remainingAmount: 0,
              isTicket: true
            },
            {
              description: 'Molar Endodontic Therapy #46',
              tooth: 'Tooth #46',
              qty: 1,
              unitPrice: 4000,
              total: 4000,
              paidAmount: 4000,
              remainingAmount: 0
            },
            {
              description: 'Core Build-up & Fiber Post #46',
              tooth: 'Tooth #46',
              qty: 1,
              unitPrice: 2400,
              total: 2400,
              paidAmount: 2400,
              remainingAmount: 0
            }
          ]
        }
      ],
      orders: [
        {
          id: 'ORD-2026-005',
          orderNumber: 'ORD-2026-005',
          patientId: 'PT-1005',
          patientName: 'Bikash Karki',
          orderType: 'Crown',
          toothOrImplantDetails: 'Tooth #46',
          assignedStaffOrLab: 'Kathmandu Dental Milling Lab',
          labName: 'Kathmandu Dental Milling Lab',
          clinicalSpecifications: 'Monolithic Solid Zirconia Full Contour Crown #46',
          materials: 'Monolithic Solid Zirconia',
          shade: 'A3.5',
          expectedCompletionDate: '2026-11-05T12:00:00.000Z',
          cost: 4000,
          paidAmount: 4000,
          balanceDue: 0,
          paymentStatus: 'Paid',
          progressStatus: 'Pending',
          status: 'Pending',
          orderDate: '2026-10-29',
          expectedDate: '2026-11-05'
        }
      ],
      imaging: [
        {
          id: 'XRAY-2026-005',
          title: 'Digital IOPA Radiograph #46 (Working Length)',
          radiographType: 'Periapical (IOPA)',
          toothNumber: '46',
          date: '2026-10-29',
          clinicalNotes: 'Digital IOPA Radiograph #46 (Working Length) for Bikash Karki',
          findings: 'Periapical radiolucency on distal root',
          url: '/images/iopa_default.png',
          uploadedAt: '2026-10-29T16:00:00.000Z'
        }
      ]
    }
  ];
}

function getAppointments(patients, doctorName = 'Dr. Mukesh Kushwaha') {
  return [
    {
      id: 'APT-1001',
      patientId: 'PT-1001',
      patientName: 'Aarav Sharma',
      patientPhone: '9841234567',
      date: '2026-10-28',
      time: '10:00 AM',
      chair: 'Chair 1 (Main Operatory)',
      treatmentType: 'Root Canal Therapy (RCT Sitting 1) #16',
      doctorName: doctorName,
      status: 'Confirmed'
    },
    {
      id: 'APT-1002',
      patientId: 'PT-1002',
      patientName: 'Sunita Adhikari',
      patientPhone: '9851122334',
      date: '2026-10-28',
      time: '11:30 AM',
      chair: 'Chair 2 (Orthodontic & Hygiene)',
      treatmentType: 'Root Planing Re-Evaluation & Polish',
      doctorName: doctorName,
      status: 'Confirmed'
    },
    {
      id: 'APT-1003',
      patientId: 'PT-1003',
      patientName: 'Rohan Shrestha',
      patientPhone: '9812345678',
      date: '2026-10-28',
      time: '02:00 PM',
      chair: 'Chair 1 (Main Operatory)',
      treatmentType: 'Surgical Disimpaction #38',
      doctorName: doctorName,
      status: 'Confirmed'
    },
    {
      id: 'APT-1004',
      patientId: 'PT-1004',
      patientName: 'Pooja Thapa',
      patientPhone: '9860123456',
      date: '2026-10-29',
      time: '09:30 AM',
      chair: 'Chair 2 (Orthodontic & Hygiene)',
      treatmentType: 'Aesthetic Polish & Vitality Follow-Up #11',
      doctorName: doctorName,
      status: 'Confirmed'
    },
    {
      id: 'APT-1005',
      patientId: 'PT-1005',
      patientName: 'Bikash Karki',
      patientPhone: '9841887766',
      date: '2026-10-29',
      time: '11:00 AM',
      chair: 'Chair 1 (Main Operatory)',
      treatmentType: 'Canal Obturation & Temp Seal #46',
      doctorName: doctorName,
      status: 'Confirmed'
    }
  ];
}

const defaultExpenses = [
  {
    id: 'TXN-EXP-01',
    date: '2026-10-24',
    refNumber: 'EXP-RENT-1024',
    payerOrRecipient: 'Kathmandu Complex Landlord',
    type: 'EXPENSE',
    category: 'Clinic Rent & Lease',
    amount: 65000,
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    relatedPatientId: null,
    notes: 'Clinic Space Rent for October 2026',
    createdAt: '2026-10-24T09:00:00.000Z'
  },
  {
    id: 'TXN-EXP-02',
    date: '2026-10-25',
    refNumber: 'EXP-SUPPLY-1025',
    payerOrRecipient: 'Nepal Dental Supplies Pvt. Ltd.',
    type: 'EXPENSE',
    category: 'Dental Consumables & PPE',
    amount: 18500,
    paymentMethod: 'Fonepay QR',
    status: 'Completed',
    relatedPatientId: null,
    notes: 'Composite syringes, bonding agents, latex-free gloves, suction tips',
    createdAt: '2026-10-25T11:30:00.000Z'
  },
  {
    id: 'TXN-EXP-03',
    date: '2026-10-26',
    refNumber: 'EXP-ELEC-1026',
    payerOrRecipient: 'Nepal Electricity Authority',
    type: 'EXPENSE',
    category: 'Utilities & Power',
    amount: 12400,
    paymentMethod: 'eSewa',
    status: 'Completed',
    relatedPatientId: null,
    notes: 'Clinic Three-Phase Electricity & Autoclave Power',
    createdAt: '2026-10-26T14:15:00.000Z'
  },
  {
    id: 'TXN-EXP-04',
    date: '2026-10-27',
    refNumber: 'EXP-WASTE-1027',
    payerOrRecipient: 'Bio-hazard Medical Waste Solutions',
    type: 'EXPENSE',
    category: 'Bio-Medical Waste Disposal',
    amount: 4500,
    paymentMethod: 'Fonepay QR',
    status: 'Completed',
    relatedPatientId: null,
    notes: 'Sharps & Clinical Waste Disposal Service',
    createdAt: '2026-10-27T10:00:00.000Z'
  },
  {
    id: 'TXN-EXP-05',
    date: '2026-10-28',
    refNumber: 'EXP-LAB-1028',
    payerOrRecipient: 'Kathmandu Dental Ceramics Milling Lab',
    type: 'EXPENSE',
    category: 'Lab Work Expense',
    amount: 22000,
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    relatedPatientId: null,
    notes: 'Settlement for batch prosthetics & zirconia crowns',
    createdAt: '2026-10-28T16:30:00.000Z'
  },
  {
    id: 'TXN-EXP-06',
    date: '2026-10-29',
    refNumber: 'EXP-INTERNET-1029',
    payerOrRecipient: 'WorldLink Communications',
    type: 'EXPENSE',
    category: 'Internet & Cloud Hosting',
    amount: 3200,
    paymentMethod: 'Fonepay QR',
    status: 'Completed',
    relatedPatientId: null,
    notes: 'Optical Fiber High-Speed Internet for Cloud EHR & PACS Sync',
    createdAt: '2026-10-29T08:30:00.000Z'
  },
  {
    id: 'TXN-EXP-07',
    date: '2026-10-24',
    refNumber: 'SAL-421074',
    payerOrRecipient: 'Pooja Thapa',
    type: 'EXPENSE',
    category: 'Staff Salary & Payroll',
    amount: 25500,
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    relatedPatientId: null,
    notes: 'Salary Payment for Dental Assistant',
    createdAt: '2026-10-24T09:00:21.074Z'
  },
  {
    id: 'TXN-EXP-08',
    date: '2026-10-24',
    refNumber: 'SAL-421075',
    payerOrRecipient: 'Sita Thapa',
    type: 'EXPENSE',
    category: 'Staff Salary & Payroll',
    amount: 22000,
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    relatedPatientId: null,
    notes: 'Salary Payment for Receptionist',
    createdAt: '2026-10-24T09:10:00.074Z'
  }
];

function updateTenantStore(targetPath, defaultDoctor = 'Dr. Mukesh Kushwaha') {
  if (!fs.existsSync(targetPath)) return;
  const data = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

  const doc = (data.doctors && data.doctors.length > 0)
    ? data.doctors[0].name
    : (data.clinicProfile?.doctorInCharge || defaultDoctor);

  const newPatients = getFivePatients(doc);
  const newAppointments = getAppointments(newPatients, doc);

  // Extract all centralized items from the 5 patients
  const allOrders = newPatients.flatMap(p => p.orders || []);
  const allXrays = newPatients.flatMap(p => (p.imaging || []).map(img => ({
    ...img,
    patientId: p.id,
    patientName: p.name,
    patientPhone: p.phone
  })));

  const allReceipts = newPatients.flatMap(p => (p.invoices || []).map(inv => ({
    receiptNumber: inv.receiptNumber,
    patientId: p.id,
    patientName: p.name,
    invoiceId: inv.invoiceNumber,
    date: inv.date,
    amount: inv.paid,
    paymentMethod: inv.paymentMethod,
    paymentType: 'INVOICE_PAYMENT',
    refNumber: `REC-${inv.invoiceNumber}`,
    notes: `Payment for ${inv.invoiceNumber}`
  })));

  const allFinanceTxns = allReceipts.map((r, i) => ({
    id: `TXN-${1000 + i}`,
    date: r.date,
    refNumber: r.receiptNumber,
    payerOrRecipient: r.patientName,
    type: 'INCOME',
    category: 'Patient Treatment',
    amount: r.amount,
    paymentMethod: r.paymentMethod,
    status: 'Completed',
    relatedPatientId: r.patientId,
    notes: `Settlement for invoice #${r.invoiceId}`
  }));

  // Preserve any existing expenses or add defaults
  const existingExpenses = (data.financeTransactions || []).filter(t => t.type === 'EXPENSE' || t.type === 'PAYOUT');
  const expensesToUse = existingExpenses.length >= 5 ? existingExpenses : defaultExpenses;

  // Update store
  data.patients = newPatients;
  data.appointments = newAppointments;
  data.orders = allOrders;
  data.xrays = allXrays;
  data.receipts = allReceipts;
  data.financeTransactions = [...allFinanceTxns, ...expensesToUse];

  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[SEED] Successfully updated ${path.basename(targetPath)} with 5 complete patient records!`);
}

// Update target files
updateTenantStore(path.join(__dirname, 'data', 'tenants', 'tenant-nepal-dental.json'), 'Dr. Mukesh Kushwaha');
updateTenantStore(path.join(__dirname, 'data', 'tenants', 'tenant-rajesh-dental-5977.json'), 'Rajesh Sada');
updateTenantStore(path.join(__dirname, 'data', 'clinic_data.json'), 'Dr. Mukesh Kushwaha');

console.log('[COMPLETE] All patient data refreshed to 5 clean, verified patients.');
