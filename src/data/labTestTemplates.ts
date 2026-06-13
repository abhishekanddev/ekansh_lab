// AUTO-GENERATED from ekansh_portal lab_test_templates.dart — do not hand-edit.
// Regenerate via scripts/convert_templates.py if the Flutter templates change.

export type ParameterInputType =
  | "text"
  | "numeric"
  | "dropdown"
  | "grid"
  | "sensitivityGrid";

export type CyclePhase =
  | "notApplicable"
  | "follicular"
  | "ovulatory"
  | "luteal"
  | "postmenopausal";

export interface TemplateParameter {
  name: string;
  unit?: string;
  normalRange?: string;
  section?: string;
  inputType?: ParameterInputType;
  dropdownOptions?: string[];
  gridRows?: string[];
  gridColumns?: string[];
  gridPositiveThreshold?: string;
  gridCellOptions?: string[];
  rangeByGender?: Record<string, string>;
  rangeByCyclePhase?: Record<string, string>;
  isCalculated?: boolean;
}

export interface LabTestTemplate {
  testName: string;
  category: string;
  parameters: TemplateParameter[];
}

export const LAB_TEST_TEMPLATES: LabTestTemplate[] = [
    // ── 1. CBC ─────────────────────────────────────────────────────────

    {
      testName: 'CBC (Complete Blood Count)',
      category: 'Hematology',
      parameters: [
        // Root parameters
        {
          name: 'Hemoglobin',
          unit: 'gm%',
          normalRange: '13.5-17.5',
          rangeByGender: {'Male': '13.5-17.5', 'Female': '11.5-15.5'},
        },
        {name: 'Total Leucocyte Count', unit: '/cumm', normalRange: '4000-10000'},
        // Differential Leucocyte Count
        {name: 'Neutrophils', unit: '%', normalRange: '40-80', section: 'Differential Leucocyte Count'},
        {name: 'Lymphocytes', unit: '%', normalRange: '20-40', section: 'Differential Leucocyte Count'},
        {name: 'Eosinophils', unit: '%', normalRange: '1-6', section: 'Differential Leucocyte Count'},
        {name: 'Monocytes', unit: '%', normalRange: '2-10', section: 'Differential Leucocyte Count'},
        {name: 'Basophils', unit: '%', normalRange: '0-1', section: 'Differential Leucocyte Count', isCalculated: true},
        // Absolute Leucocyte Count
        {name: 'Absolute Neutrophils', unit: '/cumm', normalRange: '2000-7000', section: 'Absolute Leucocyte Count', isCalculated: true},
        {name: 'Absolute Lymphocytes', unit: '/cumm', normalRange: '1000-3000', section: 'Absolute Leucocyte Count', isCalculated: true},
        {name: 'Absolute Eosinophils', unit: '/cumm', normalRange: '20-500', section: 'Absolute Leucocyte Count', isCalculated: true},
        {name: 'Absolute Monocytes', unit: '/cumm', normalRange: '200-1000', section: 'Absolute Leucocyte Count', isCalculated: true},
        {name: 'Absolute Basophils', unit: '/cumm', normalRange: '0-100', section: 'Absolute Leucocyte Count', isCalculated: true},
        // RBC Indices
        {
          name: 'RBC Count',
          unit: 'Million/cumm',
          normalRange: '4.5-5.5',
          section: 'RBC Indices',
          rangeByGender: {'Male': '4.5-5.5', 'Female': '3.8-4.8'},
        },
        {
          name: 'Hct',
          unit: '%',
          normalRange: '40-50',
          section: 'RBC Indices',
          rangeByGender: {'Male': '40-50', 'Female': '36-46'},
        },
        {name: 'MCV', unit: 'fL', normalRange: '81-101', section: 'RBC Indices', isCalculated: true},
        {name: 'MCH', unit: 'pg', normalRange: '27-32', section: 'RBC Indices', isCalculated: true},
        {name: 'MCHC', unit: 'g/dL', normalRange: '31.5-34.5', section: 'RBC Indices', isCalculated: true},
        {name: 'RDW-CV', unit: '%', normalRange: '11.6-14.0', section: 'RBC Indices'},
        {name: 'RDW-SD', unit: 'fL', normalRange: '39-46', section: 'RBC Indices'},
        // Platelets Indices
        {name: 'Platelet Count', unit: '/cumm', normalRange: '150000-410000', section: 'Platelets Indices'},
        {name: 'PCT', unit: '%', normalRange: '0.18-0.39', section: 'Platelets Indices'},
        {name: 'MPV', unit: 'fL', normalRange: '7.5-11.5', section: 'Platelets Indices'},
        {name: 'PDW', unit: 'fL', normalRange: '11.0-15.5', section: 'Platelets Indices'},
        {name: 'P-LCR', unit: '%', normalRange: '11.0-45.0', section: 'Platelets Indices'},
        {name: 'P-LCC', unit: '10^3/uL', normalRange: '30.0-90.0', section: 'Platelets Indices'},
      ],
    },

    // ── 2. ESR ─────────────────────────────────────────────────────────

    {
      testName: 'ESR',
      category: 'Hematology',
      parameters: [
        {name: 'ESR', unit: 'mm/hr', normalRange: '0-20'},
      ],
    },

    // ── 3. Coagulation Profile ─────────────────────────────────────────

    {
      testName: 'Coagulation Profile',
      category: 'Hematology',
      parameters: [
        {name: 'Bleeding Time', unit: 'Minute', normalRange: '2-7'},
        {name: 'Clotting Time', unit: 'Minute', normalRange: '4-9'},
        {name: 'Patient Value', unit: 'seconds', normalRange: '10-16', section: 'Prothrombin time'},
        {name: 'Control Value', unit: 'seconds', section: 'Prothrombin time'},
        {name: 'INR Value', section: 'Prothrombin time', isCalculated: true},
        {name: 'Index', section: 'Prothrombin time', isCalculated: true},
        {name: 'APTT Patient Value', unit: 'seconds', normalRange: '22-40', section: 'Activated partial thromboplastin time (APTT)'},
        {name: 'APTT Control Value', unit: 'seconds', section: 'Activated partial thromboplastin time (APTT)'},
      ],
    },

    // ── 4. Blood Group ─────────────────────────────────────────────────

    {
      testName: 'Blood Group & Rh',
      category: 'Hematology',
      parameters: [
        {
          name: 'ABO Group',
          inputType: "dropdown",
          dropdownOptions: ['A', 'B', 'AB', 'O'],
        },
        {
          name: 'Rh Factor',
          inputType: "dropdown",
          dropdownOptions: ['Positive', 'Negative'],
        },
      ],
    },

    // ── 5. Lipid Profile ───────────────────────────────────────────────

    {
      testName: 'Lipid Profile',
      category: 'Biochemistry',
      parameters: [
        {name: 'Total Cholesterol', unit: 'mg/dL', normalRange: '0-200'},
        {name: 'Triglycerides', unit: 'mg/dL', normalRange: '0-170'},
        {name: 'HDL Cholesterol', unit: 'mg/dL', normalRange: '40-70'},
        {name: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '0-100', isCalculated: true},
        {name: 'VLDL Cholesterol', unit: 'mg/dL', normalRange: '6-38', isCalculated: true},
        {name: 'LDL/HDL Ratio', unit: '', normalRange: '2.5-3.5', isCalculated: true},
        {name: 'Total Cholesterol/HDL Ratio', unit: '', normalRange: '3.5-5', isCalculated: true},
      ],
    },

    // ── 6. LFT ─────────────────────────────────────────────────────────

    {
      testName: 'Liver Function Test (LFT)',
      category: 'Biochemistry',
      parameters: [
        {name: 'Total Bilirubin', unit: 'mg/dL', normalRange: '0.1-1.2', section: 'Bilirubin'},
        {name: 'Direct Bilirubin', unit: 'mg/dL', normalRange: '0.0-0.4', section: 'Bilirubin'},
        {name: 'Indirect Bilirubin', unit: 'mg/dL', normalRange: '0.1-1.0', section: 'Bilirubin', isCalculated: true},
        {name: 'SGPT', unit: 'IU/L', normalRange: '0-40', section: 'Enzymes'},
        {name: 'SGOT', unit: 'IU/L', normalRange: '0-35', section: 'Enzymes'},
        {name: 'SGOT/SGPT Ratio', unit: 'RATIO', normalRange: '0-46', section: 'Enzymes', isCalculated: true},
        {name: 'Alkaline Phosphatase', unit: 'U/L', normalRange: '56-119', section: 'Enzymes'},
        {name: 'GGT', unit: 'U/L', normalRange: '9-48', section: 'Enzymes'},
        {name: 'Total Proteins', unit: 'g/dL', normalRange: '6.2-8.0', section: 'Proteins'},
        {name: 'Albumin', unit: 'g/dL', normalRange: '3.5-5.5', section: 'Proteins'},
        {name: 'Globulin', unit: 'g/dL', normalRange: '2.3-3.5', section: 'Proteins', isCalculated: true},
        {name: 'A : G Ratio', unit: 'RATIO', normalRange: '1.0-1.2', section: 'Proteins', isCalculated: true},
      ],
    },

    // ── 7. KFT ─────────────────────────────────────────────────────────

    {
      testName: 'Kidney Function Test (KFT)',
      category: 'Biochemistry',
      parameters: [
        {name: 'Blood Urea', unit: 'mg/dL', normalRange: '15-40'},
        {
          name: 'Serum Creatinine',
          unit: 'mg/dL',
          normalRange: '0.6-1.3',
        },
        {name: 'BUN', unit: 'mg/dL', normalRange: '7-20'},
        {name: 'Uric Acid', unit: 'mg/dL', normalRange: '3.6-7.7'},
        {name: 'Calcium', unit: 'mg/dL', normalRange: '8.6-10.2'},
        {name: 'Sodium', unit: 'mEq/L', normalRange: '135-150', section: 'Electrolytes'},
        {name: 'Potassium', unit: 'mEq/L', normalRange: '3.5-5.0', section: 'Electrolytes'},
        {name: 'Chloride', unit: 'mEq/L', normalRange: '98-106', section: 'Electrolytes'},
        {name: 'Phosphorus', unit: 'mg/dL', normalRange: '2.5-4.5', section: 'Minerals'},
      ],
    },

    // ── 8. Blood Sugar (split into 3 individual tests) ─────────────────

    {
      testName: 'Fasting Blood Sugar (FBS)',
      category: 'Biochemistry',
      parameters: [
        {name: 'Fasting Blood Sugar', unit: 'mg/dL', normalRange: '70-110'},
      ],
    },
    {
      testName: 'Post Prandial Blood Sugar (PPBS)',
      category: 'Biochemistry',
      parameters: [
        {name: 'Post Prandial Blood Sugar', unit: 'mg/dL', normalRange: '70-160'},
      ],
    },
    {
      testName: 'Random Blood Sugar (RBS)',
      category: 'Biochemistry',
      parameters: [
        {name: 'Random Blood Sugar', unit: 'mg/dL', normalRange: '70-140'},
      ],
    },

    // ── 9. HbA1c ───────────────────────────────────────────────────────

    {
      testName: 'HbA1c',
      category: 'Biochemistry',
      parameters: [
        {name: 'HbA1c', unit: '%', normalRange: '< 5.7'},
        {name: 'Estimated Avg. Glucose', unit: 'mg/dL', normalRange: '62.30-142.72'},
      ],
    },

    // ── 10. Electrolytes ───────────────────────────────────────────────

    {
      testName: 'Electrolytes',
      category: 'Biochemistry',
      parameters: [
        {name: 'Sodium (Na+)', unit: 'mEq/L', normalRange: '135-150'},
        {name: 'Potassium (K+)', unit: 'mEq/L', normalRange: '3.5-5.0'},
        {name: 'Chloride (Cl-)', unit: 'mEq/L', normalRange: '98-106'},
        {name: 'Bicarbonate (HCO3-)', unit: 'mEq/L', normalRange: '22-28'},
        {name: 'Calcium (Ca++)', unit: 'mg/dL', normalRange: '8.6-10.2'},
        {name: 'Magnesium (Mg++)', unit: 'mg/dL', normalRange: '1.8-3.8'},
        {name: 'Phosphate', unit: 'mg/dL', normalRange: '2.5-4.5'},
      ],
    },

    // ── 11. CRP ─────────────────────────────────────────────────────────

    {
      testName: 'CRP (C-Reactive Protein)',
      category: 'Biochemistry',
      parameters: [
        {name: 'CRP (Quantitative)', unit: 'mg/L', normalRange: '< 6.0'},
      ],
    },

    // ── 12. Iron Studies ───────────────────────────────────────────────

    {
      testName: 'Iron Studies',
      category: 'Biochemistry',
      parameters: [
        {name: 'Serum Iron', unit: 'µg/dL', normalRange: '50-150'},
        {name: 'TIBC', unit: 'µg/dL', normalRange: '250-370'},
        {
          name: 'Ferritin',
          unit: 'ng/mL',
          normalRange: '30-400',
          rangeByGender: {'Male': '30-400', 'Female': '13-150'},
        },
        {name: 'Transferrin Saturation', unit: '%', normalRange: '20-50'},
      ],
    },

    // ── 13. Amylase & Lipase ───────────────────────────────────────────

    {
      testName: 'Serum Amylase & Lipase',
      category: 'Biochemistry',
      parameters: [
        {name: 'Serum Amylase', unit: 'U/L', normalRange: '10-90'},
        {name: 'Serum Lipase', unit: 'U/L', normalRange: '0-60'},
      ],
    },

    // ── 14. Vitamin Panel ──────────────────────────────────────────────

    {
      testName: 'Vitamin Panel',
      category: 'Biochemistry',
      parameters: [
        {name: 'Vitamin D3 (25-OH)', unit: 'ng/mL', normalRange: '30-100'},
        {name: 'Vitamin B12', unit: 'pg/mL', normalRange: '197-771'},
        {name: 'Folic Acid', unit: 'ng/mL', normalRange: '3.56-20.0'},
      ],
    },

    // ── 15. Thyroid ────────────────────────────────────────────────────

    {
      testName: 'Thyroid Profile (T3 T4 TSH)',
      category: 'Endocrinology',
      parameters: [
        {name: 'Total T3', unit: 'ng/dL', normalRange: '60-180'},
        {name: 'Total T4', unit: 'µg/dL', normalRange: '3.20-12.6'},
        {name: 'TSH', unit: 'µIU/mL', normalRange: '0.55-4.78'},
      ],
    },

    // ── 16. Widal ──────────────────────────────────────────────────────

    {
      testName: 'Widal Test',
      category: 'Serology',
      parameters: [
        {
          name: 'Method',
          inputType: "dropdown",
          dropdownOptions: ['Slide Method', 'Tube Method', 'Both Methods'],
        },
        {
          name: 'Widal Agglutination',
          inputType: "grid",
          normalRange: '< 1:80',
          gridRows: ['S. Typhi O', 'S. Typhi H', 'S. Paratyphi AH', 'S. Paratyphi BH'],
          gridColumns: ['1:20', '1:40', '1:80', '1:160', '1:320'],
          gridPositiveThreshold: '1:160',
        },
        {
          name: 'Result',
          normalRange: '',
        },
      ],
    },

    // ── 17. HIV / HBsAg / HCV ──────────────────────────────────────────

    {
      testName: 'HIV / HBsAg / HCV',
      category: 'Serology',
      parameters: [
        {name: 'HIV 1 & 2 Antibody', normalRange: 'Non-Reactive', inputType: "dropdown", dropdownOptions: ['Non-Reactive', 'Reactive']},
        {name: 'HBsAg', normalRange: 'Non-Reactive', inputType: "dropdown", dropdownOptions: ['Non-Reactive', 'Reactive']},
        {name: 'Anti-HCV', normalRange: 'Non-Reactive', inputType: "dropdown", dropdownOptions: ['Non-Reactive', 'Reactive']},
      ],
    },

    // ── 18. Dengue ─────────────────────────────────────────────────────

    {
      testName: 'Dengue Profile',
      category: 'Serology',
      parameters: [
        {name: 'NS1 Antigen', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
        {name: 'Dengue IgM', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
        {name: 'Dengue IgG', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
      ],
    },

    // ── 19. Malaria ────────────────────────────────────────────────────

    {
      testName: 'Malaria Antigen (Vivax & Falciparum)',
      category: 'Serology',
      parameters: [
        {name: 'Plasmodium Vivax Antigen', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
        {name: 'Plasmodium Falciparum Antigen', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
      ],
    },

    // ── 20. Typhi Dot ──────────────────────────────────────────────────

    {
      testName: 'Typhi Dot (IgG & IgM)',
      category: 'Serology',
      parameters: [
        {name: 'Typhi Dot IgG', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
        {name: 'Typhi Dot IgM', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
      ],
    },

    // ── 21. Cardiac Markers ────────────────────────────────────────────

    {
      testName: 'Cardiac Markers',
      category: 'Cardiology',
      parameters: [
        {name: 'Troponin I', unit: 'ng/mL', normalRange: '< 0.04'},
        {name: 'CK-MB', unit: 'U/L', normalRange: '0-25'},
        {name: 'LDH', unit: 'U/L', normalRange: '230-460'},
        {name: 'BNP / NT-proBNP', unit: 'pg/mL', normalRange: '< 100'},
      ],
    },

    // ── 21. ABG ────────────────────────────────────────────────────────

    {
      testName: 'ABG (Arterial Blood Gas)',
      category: 'Special',
      parameters: [
        {name: 'pH', normalRange: '7.35-7.45'},
        {name: 'PCO2', unit: 'mmHg', normalRange: '35.00-45.00'},
        {name: 'Bicarbonate (HCO3)', unit: 'mEq/L', normalRange: '21.00-28.00'},
        {name: 'Total CO2 Contents (TCO2)', unit: 'mmol/L', normalRange: '23.00-27.00'},
        {name: 'Standard Bicarbonate (SBC)', unit: 'mEq/L', normalRange: '22.00-26.00'},
        {name: 'Base Excess', unit: 'mEq/L', normalRange: '2.00-3.00'},
        {name: 'PO2', unit: 'mmHg', normalRange: '83.00-108.00'},
        {name: 'Oxygen saturation capacity', unit: '%', normalRange: '95.00-98.00'},
        {name: 'Base Excess - Extracellular fluid', unit: 'mEq/L', normalRange: '<0.02'},
        {name: 'Hemoglobin', unit: 'g/dL', normalRange: '13.00-18.00'},
      ],
    },

    // ── 22. Urine Routine ──────────────────────────────────────────────

    {
      testName: 'Urine Routine & Microscopy',
      category: 'Urinalysis',
      parameters: [
        {
          name: 'Color',
          normalRange: 'Pale Yellow',
          section: 'Physical Examination',
          inputType: "dropdown",
          dropdownOptions: ['Straw', 'Pale Yellow', 'Pale Straw', 'Yellow', 'Dark Yellow', 'Orange', 'Reddish', 'Milky', 'Light Yellow'],
        },
        {name: 'Appearance', normalRange: 'Clear', section: 'Physical Examination'},
        {name: 'pH', normalRange: '4.6-8.0', section: 'Physical Examination'},
        {name: 'Specific Gravity', normalRange: '1.005-1.030', section: 'Physical Examination'},
        {name: 'Protein', normalRange: 'Nil', section: 'Chemical Examination'},
        {name: 'Glucose', normalRange: 'Nil', section: 'Chemical Examination'},
        {name: 'Ketones', normalRange: 'Nil', section: 'Chemical Examination'},
        {name: 'Blood', normalRange: 'Nil', section: 'Chemical Examination'},
        {name: 'Bilirubin', normalRange: 'Negative', section: 'Chemical Examination'},
        {name: 'Urobilinogen', unit: 'EU/dL', normalRange: '0.1-1.0', section: 'Chemical Examination'},
        {name: 'Mucus Threads', normalRange: 'Nil', section: 'Sediment'},
        {name: 'Amorphous Material', normalRange: 'Nil', section: 'Sediment'},
        {name: 'Calcium Oxalate', normalRange: 'Nil', section: 'Sediment'},
        {name: 'Uric Acid Crystals', normalRange: 'Nil', section: 'Sediment'},
        {name: 'RBC', unit: '/hpf', normalRange: '0-2', section: 'Microscopic Examination'},
        {name: 'WBC / Pus Cells', unit: '/hpf', normalRange: '0-5', section: 'Microscopic Examination'},
        {name: 'Epithelial Cells', unit: '/hpf', normalRange: 'Few', section: 'Microscopic Examination'},
        {name: 'Casts', normalRange: 'Nil', section: 'Microscopic Examination'},
        {name: 'Crystals', normalRange: 'Nil', section: 'Microscopic Examination'},
        {name: 'Bacteria', normalRange: 'Nil', section: 'Microscopic Examination'},
        {name: 'Yeast Cells', normalRange: 'Nil', section: 'Microscopic Examination'},
        {name: 'Trichomonas', normalRange: 'Not Seen', section: 'Microscopic Examination'},
        {name: 'Triple Phosphate', normalRange: 'Nil', section: 'Sediment'},
      ],
    },

    // ── 23. Stool Routine ──────────────────────────────────────────────

    {
      testName: 'Stool Routine',
      category: 'Microbiology',
      parameters: [
        {
          name: 'Reaction(pH)',
          section: 'General Examinations',
          inputType: "dropdown",
          dropdownOptions: ['Acidic', 'Neutral', 'Alkaline'],
        },
        {
          name: 'Reducing substances',
          section: 'General Examinations',
          inputType: "dropdown",
          dropdownOptions: ['Absent', 'Present'],
        },
        {
          name: 'Occult Blood',
          section: 'General Examinations',
          inputType: "dropdown",
          dropdownOptions: ['Negative', 'Positive'],
        },
        {
          name: 'Colour',
          section: 'General Examinations',
          inputType: "dropdown",
          dropdownOptions: ['Brown', 'Yellow', 'Green', 'Black', 'Pale', 'Reddish'],
        },
        {
          name: 'Consistency',
          section: 'General Examinations',
          inputType: "dropdown",
          dropdownOptions: ['Formed', 'Semi-formed', 'Loose', 'Watery', 'Hard'],
        },
        {
          name: 'Mucus',
          section: 'General Examinations',
          inputType: "dropdown",
          dropdownOptions: ['Absent', 'Present'],
        },
        {
          name: 'Pus Cells(Leucocytes)',
          section: 'Microscopic Examination',
          inputType: "dropdown",
          dropdownOptions: ['Nil', '0-2/hpf', '2-4/hpf', '4-6/hpf', '6-8/hpf', '8-10/hpf', 'Plenty'],
        },
        {
          name: 'Epithelial cells',
          section: 'Microscopic Examination',
          inputType: "dropdown",
          dropdownOptions: ['Nil', 'Few', 'Occasional', 'Plenty'],
        },
        {
          name: "RBC's",
          section: 'Microscopic Examination',
          inputType: "dropdown",
          dropdownOptions: ['Nil', '0-2/hpf', '2-4/hpf', '4-6/hpf', 'Plenty'],
        },
        {
          name: 'Ova',
          section: 'Microscopic Examination',
          inputType: "dropdown",
          dropdownOptions: ['Not Seen', 'Seen'],
        },
        {
          name: 'Cysts',
          section: 'Microscopic Examination',
          inputType: "dropdown",
          dropdownOptions: ['Not Seen', 'Seen'],
        },
        {
          name: 'Fat Globules',
          section: 'Microscopic Examination',
          inputType: "dropdown",
          dropdownOptions: ['Absent', 'Present'],
        },
        {
          name: 'Macrophages',
          section: 'Microscopic Examination',
          inputType: "dropdown",
          dropdownOptions: ['Absent', 'Present'],
        },
        {
          name: 'Yeasts',
          section: 'Microscopic Examination',
          inputType: "dropdown",
          dropdownOptions: ['Absent', 'Present'],
        },
      ],
    },
    // ── 24. Peripheral Blood Smear / GBP ───────────────────────────────
    {
      testName: 'Peripheral Blood Smear / GBP',
      category: 'Hematology',
      parameters: [
        {
          name: 'RBC Morphology',
          inputType: "dropdown",
          dropdownOptions: [
            'Normocytic Normochromic',
            'Microcytic Hypochromic',
            'Macrocytic',
            'Dimorphic',
            'Anisocytosis',
            'Poikilocytosis',
          ],
        },
        {
          name: 'WBC Morphology',
          inputType: "dropdown",
          dropdownOptions: [
            'Normal in number and morphology',
            'Leukocytosis',
            'Leukopenia',
            'Left Shift',
            'Atypical Cells Present',
          ],
        },
        {
          name: 'Platelets',
          inputType: "dropdown",
          dropdownOptions: ['Adequate', 'Reduced', 'Increased'],
        },
        {
          name: 'Atypical Cells/Blast Cells',
          inputType: "dropdown",
          dropdownOptions: ['Not Seen', 'Seen'],
        },
        {name: 'Parasites', normalRange: 'Not Seen'},
        {name: 'Impression'},
      ],
    },
    // ── 25. Reticulocyte Count ─────────────────────────────────────────
    {
      testName: 'Reticulocyte Count',
      category: 'Hematology',
      parameters: [
        {name: 'Reticulocyte Count', unit: '%', normalRange: '0.5-2.5'},
        {name: 'Absolute Reticulocyte Count', unit: '/cumm', normalRange: '25000-75000'},
      ],
    },
    // ── 26. G6PD Screening ─────────────────────────────────────────────
    {
      testName: 'G6PD Screening',
      category: 'Hematology',
      parameters: [
        {name: 'G6PD Activity', unit: 'U/g Hb', normalRange: '6.4-18.7'},
      ],
    },
    // ── 27. D-Dimer ────────────────────────────────────────────────────
    {
      testName: 'D-Dimer',
      category: 'Hematology',
      parameters: [
        {name: 'D-Dimer', unit: 'ng/mL FEU', normalRange: '< 500'},
      ],
    },
    // ── 28. Serum Calcium ──────────────────────────────────────────────
    {
      testName: 'Serum Calcium',
      category: 'Biochemistry',
      parameters: [
        {name: 'Total Calcium', unit: 'mg/dL', normalRange: '8.6-10.2'},
        {name: 'Ionized Calcium', unit: 'mg/dL', normalRange: '4.5-5.6'},
      ],
    },
    // ── 29. Serum Phosphorus ───────────────────────────────────────────
    {
      testName: 'Serum Phosphorus',
      category: 'Biochemistry',
      parameters: [
        {name: 'Inorganic Phosphorus', unit: 'mg/dL', normalRange: '2.5-4.5'},
      ],
    },
    // ── 30. Serum Magnesium ────────────────────────────────────────────
    {
      testName: 'Serum Magnesium',
      category: 'Biochemistry',
      parameters: [
        {name: 'Serum Magnesium', unit: 'mg/dL', normalRange: '1.8-3.8'},
      ],
    },
    // ── 31. Serum Uric Acid ────────────────────────────────────────────
    {
      testName: 'Serum Uric Acid',
      category: 'Biochemistry',
      parameters: [
        {name: 'Serum Uric Acid', unit: 'mg/dL', normalRange: '3.6-7.7'},
      ],
    },
    // ── 32. Serum Protein Electrophoresis ──────────────────────────────
    {
      testName: 'Serum Protein Electrophoresis',
      category: 'Biochemistry',
      parameters: [
        {name: 'Albumin', unit: 'g/dL', normalRange: '3.5-5.0'},
        {name: 'Alpha-1 Globulin', unit: 'g/dL', normalRange: '0.1-0.3'},
        {name: 'Alpha-2 Globulin', unit: 'g/dL', normalRange: '0.6-1.0'},
        {name: 'Beta Globulin', unit: 'g/dL', normalRange: '0.7-1.1'},
        {name: 'Gamma Globulin', unit: 'g/dL', normalRange: '0.8-1.6'},
      ],
    },
    // ── 33. LDH ────────────────────────────────────────────────────────
    {
      testName: 'LDH (Lactate Dehydrogenase)',
      category: 'Biochemistry',
      parameters: [
        {name: 'Lactate Dehydrogenase (LDH)', unit: 'U/L', normalRange: '230-460'},
      ],
    },
    // ── 34. CPK (Total) ────────────────────────────────────────────────
    {
      testName: 'CPK (Creatine Phosphokinase)',
      category: 'Biochemistry',
      parameters: [
        {name: 'CPK (Total)', unit: 'U/L', normalRange: '2-26'},
      ],
    },
    // ── 35. Serum Ammonia ──────────────────────────────────────────────
    {
      testName: 'Serum Ammonia',
      category: 'Biochemistry',
      parameters: [
        {name: 'Serum Ammonia', unit: 'µmol/L', normalRange: '15-45'},
      ],
    },
    // ── 36. Glucose Tolerance Test (GTT) ───────────────────────────────
    {
      testName: 'Glucose Tolerance Test (GTT)',
      category: 'Biochemistry',
      parameters: [
        {name: 'Fasting Blood Sugar', unit: 'mg/dL', normalRange: '70-100'},
        {name: '1 Hour Plasma Glucose', unit: 'mg/dL', normalRange: '< 180'},
        {name: '2 Hour Plasma Glucose', unit: 'mg/dL', normalRange: '< 140'},
        {name: '3 Hour Plasma Glucose', unit: 'mg/dL', normalRange: '< 140'},
      ],
    },
    // ── 37. Microalbumin (Urine) ───────────────────────────────────────
    {
      testName: 'Microalbumin (Urine)',
      category: 'Biochemistry',
      parameters: [
        {name: 'Microalbumin', unit: 'mg/L', normalRange: '< 20'},
        {name: 'Urine Creatinine', unit: 'mg/dL', normalRange: '40-300'},
        {name: 'Albumin/Creatinine Ratio (ACR)', unit: 'mg/g', normalRange: '< 30'},
      ],
    },
    // ── 38. BUN/Creatinine Ratio ───────────────────────────────────────
    {
      testName: 'BUN/Creatinine Ratio',
      category: 'Biochemistry',
      parameters: [
        {name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', normalRange: '7-20'},
        {name: 'Serum Creatinine', unit: 'mg/dL', normalRange: '0.6-1.3'},
        {name: 'BUN/Creatinine Ratio', unit: '', normalRange: '10-20'},
      ],
    },
    // ── 40. Gamma GT (GGT) ─────────────────────────────────────────────
    {
      testName: 'Gamma GT (GGT)',
      category: 'Biochemistry',
      parameters: [
        {name: 'GGT', unit: 'U/L', normalRange: '9-48'},
      ],
    },
    // ── 41. Serum Cholinesterase ───────────────────────────────────────
    {
      testName: 'Serum Cholinesterase',
      category: 'Biochemistry',
      parameters: [
        {name: 'Serum Cholinesterase', unit: 'U/L', normalRange: '5300-12900'},
      ],
    },
    // ── 42. Prolactin ──────────────────────────────────────────────────
    {
      testName: 'Prolactin',
      category: 'Endocrinology',
      parameters: [
        {name: 'Serum Prolactin', unit: 'ng/mL', normalRange: '2-15'},
      ],
    },
    // ── 43. Cortisol (Morning) ─────────────────────────────────────────
    {
      testName: 'Cortisol (Morning)',
      category: 'Endocrinology',
      parameters: [
        {name: 'Serum Cortisol (8 AM)', unit: 'µg/dL', normalRange: '4.8-19.5'},
      ],
    },
    // ── 43b. Cortisol (Evening) ────────────────────────────────────────
    {
      testName: 'Cortisol (Evening)',
      category: 'Endocrinology',
      parameters: [
        {name: 'Serum Cortisol (4 PM)', unit: 'µg/dL', normalRange: '3.1-16.7'},
      ],
    },
    // ── 44. Testosterone ───────────────────────────────────────────────
    {
      testName: 'Testosterone',
      category: 'Endocrinology',
      parameters: [
        {name: 'Total Testosterone', unit: 'ng/dL', normalRange: '175-781'},
        {name: 'Free Testosterone', unit: 'pg/mL', normalRange: '9-30'},
      ],
    },
    // ── 45. FSH & LH ───────────────────────────────────────────────────
    {
      testName: 'FSH & LH',
      category: 'Endocrinology',
      parameters: [
        {
          name: 'Follicle Stimulating Hormone (FSH)',
          unit: 'mIU/mL',
          normalRange: '3.5-12.5',
          rangeByCyclePhase: {
            'Follicular': '3.5-12.5',
            'Ovulatory': '4.7-21.5',
            'Luteal': '1.7-7.7',
            'Postmenopausal': '25.8-134.8',
          },
        },
        {
          name: 'Luteinizing Hormone (LH)',
          unit: 'mIU/mL',
          normalRange: '2.4-12.6',
          rangeByCyclePhase: {
            'Follicular': '2.4-12.6',
            'Ovulatory': '14.0-95.6',
            'Luteal': '1.0-11.4',
            'Postmenopausal': '7.7-58.5',
          },
        },
      ],
    },
    // ── 46. Estradiol (E2) ─────────────────────────────────────────────
    {
      testName: 'Estradiol (E2)',
      category: 'Endocrinology',
      parameters: [
        {
          name: 'Serum Estradiol (E2)',
          unit: 'pg/mL',
          normalRange: '12.5-166',
          rangeByCyclePhase: {
            'Follicular': '12.5-166',
            'Ovulatory': '85.8-498',
            'Luteal': '43.8-211',
            'Postmenopausal': '< 54.7',
          },
        },
      ],
    },
    // ── 47. Progesterone ───────────────────────────────────────────────
    {
      testName: 'Progesterone',
      category: 'Endocrinology',
      parameters: [
        {
          name: 'Serum Progesterone',
          unit: 'ng/mL',
          normalRange: '0.14-2.06',
          rangeByCyclePhase: {
            'Follicular': '0.1-0.3',
            'Ovulatory': '0.1-1.5',
            'Luteal': '1.8-23.9',
            'Postmenopausal': '< 0.2',
          },
        },
      ],
    },
    // ── 48. Beta hCG ───────────────────────────────────────────────────
    {
      testName: 'Beta hCG',
      category: 'Endocrinology',
      parameters: [
        {name: 'Serum Beta hCG', unit: 'mIU/mL', normalRange: '< 5.0'},
      ],
    },
    // ── 49. Insulin (Fasting) ──────────────────────────────────────────
    {
      testName: 'Insulin (Fasting)',
      category: 'Endocrinology',
      parameters: [
        {name: 'Fasting Insulin', unit: 'µU/mL', normalRange: '2.6-24.9'},
        {name: 'HOMA-IR', unit: '', normalRange: '< 2.5'},
      ],
    },
    // ── 50. Chikungunya IgM ────────────────────────────────────────────
    {
      testName: 'Chikungunya IgM',
      category: 'Serology',
      parameters: [
        {name: 'Chikungunya IgM Antibody', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
      ],
    },
    // ── 51. Leptospira IgM ─────────────────────────────────────────────
    {
      testName: 'Leptospira IgM & IgG',
      category: 'Serology',
      parameters: [
        {name: 'Leptospira IgM Antibody', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
        {name: 'Leptospira IgG Antibody', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
      ],
    },
    // ── 52. Scrub Typhus IgM ───────────────────────────────────────────
    {
      testName: 'Scrub Typhus IgM',
      category: 'Serology',
      parameters: [
        {name: 'Scrub Typhus IgM Antibody', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
      ],
    },
    // ── 53. ASO Titre ──────────────────────────────────────────────────
    {
      testName: 'ASO Titre',
      category: 'Serology',
      parameters: [
        {name: 'ASO Quantitative', unit: 'IU/mL', normalRange: '< 200'},
      ],
    },
    // ── 54. RA Factor ──────────────────────────────────────────────────
    {
      testName: 'RA Factor',
      category: 'Serology',
      parameters: [
        {
          name: 'RA Factor Qualitative',
          normalRange: 'Negative',
          inputType: "dropdown",
          dropdownOptions: ['Negative', 'Positive'],
        },
        {name: 'RA Factor Quantitative', unit: 'IU/mL', normalRange: '< 14'},
      ],
    },
    // ── 55. ANA (Antinuclear Antibody) ─────────────────────────────────
    {
      testName: 'ANA (Antinuclear Antibody)',
      category: 'Serology',
      parameters: [
        {
          name: 'Anti Nuclear Antibodies',
          inputType: "dropdown",
          dropdownOptions: ['negative', 'Positive(Weak)', 'Positive (Strongly Positive)', 'positive'],
        },
        {
          name: 'Primary Dilution',
          inputType: "dropdown",
          dropdownOptions: ['1:40', '1:80', '1:160', '1:320', '1:640', '1:1280'],
        },
        {
          name: 'Primary Intensity of IF',
          inputType: "dropdown",
          dropdownOptions: ['1+', '2+', '3+', '4+'],
        },
        {
          name: 'ANA Pattern',
          inputType: "dropdown",
          dropdownOptions: ['Homogeneous', 'Speckled', 'Nucleolar', 'Centromere', 'Cytoplasmic', 'Mixed'],
        },
        {name: 'End Point Dilution'},
        {name: 'Note'},
      ],
    },
    // ── 56. Hepatitis B Panel ──────────────────────────────────────────
    {
      testName: 'Hepatitis B Panel',
      category: 'Serology',
      parameters: [
        {name: 'HBsAg', normalRange: 'Non-Reactive', inputType: "dropdown", dropdownOptions: ['Non-Reactive', 'Reactive']},
        {name: 'Anti-HBs', unit: 'mIU/mL', normalRange: '> 10'},
        {name: 'HBeAg', normalRange: 'Non-Reactive', inputType: "dropdown", dropdownOptions: ['Non-Reactive', 'Reactive']},
        {name: 'Anti-HBe', normalRange: 'Non-Reactive', inputType: "dropdown", dropdownOptions: ['Non-Reactive', 'Reactive']},
        {name: 'Anti-HBc IgM', normalRange: 'Non-Reactive', inputType: "dropdown", dropdownOptions: ['Non-Reactive', 'Reactive']},
      ],
    },
    // ── 57. VDRL / RPR ─────────────────────────────────────────────────
    {
      testName: 'VDRL / RPR',
      category: 'Serology',
      parameters: [
        {name: 'VDRL / RPR Result', normalRange: 'Non-Reactive', inputType: "dropdown", dropdownOptions: ['Non-Reactive', 'Reactive']},
      ],
    },
    // ── 58. Pregnancy Test (Urine) ─────────────────────────────────────
    {
      testName: 'Pregnancy Test (Urine)',
      category: 'Serology',
      parameters: [
        {name: 'hCG (Qualitative)', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
      ],
    },
    // ── 59. Culture & Sensitivity (Urine) ──────────────────────────────
    {
      testName: 'Urine Culture and Sensitivity',
      category: 'Microbiology',
      parameters: [
        {name: 'Nature of Specimen'},
        {name: 'Organism Isolated'},
        {name: 'Microscopy'},
        {name: 'Colony Count', unit: 'Unit', normalRange: '<10000'},
        {name: 'Minimum Inhibitory Concentration (MIC)', unit: 'µg/mL'},
        {
          name: 'Antibiotic Sensitivity',
          inputType: "sensitivityGrid",
          gridCellOptions: ['S', 'I', 'R'],
        },
      ],
    },
    // ── 60. Culture & Sensitivity (Blood) ──────────────────────────────
    {
      testName: 'Culture & Sensitivity (Blood)',
      category: 'Microbiology',
      parameters: [
        {name: 'Isolated Organism', section: 'Culture Report'},
        {name: 'Incubation Period', normalRange: '5 Days', section: 'Culture Report'},
        {
          name: 'Antibiotic Sensitivity',
          inputType: "sensitivityGrid",
          section: 'Sensitivity',
          gridCellOptions: ['S', 'I', 'R'],
        },
      ],
    },
    // ── 61. Culture & Sensitivity (Sputum) ─────────────────────────────
    {
      testName: 'Culture & Sensitivity (Sputum)',
      category: 'Microbiology',
      parameters: [
        {name: 'Isolated Organism', section: 'Culture Report'},
        {name: 'Normal Flora', normalRange: 'Commensals present', section: 'Culture Report'},
        {
          name: 'Antibiotic Sensitivity',
          inputType: "sensitivityGrid",
          section: 'Sensitivity',
          gridCellOptions: ['S', 'I', 'R'],
        },
      ],
    },
    // ── 62. KOH Mount (Fungal) ─────────────────────────────────────────
    {
      testName: 'KOH Mount (Fungal)',
      category: 'Microbiology',
      parameters: [
        {name: 'KOH Mount', normalRange: 'No Fungal Elements Seen'},
      ],
    },
    // ── 63. Gram Stain ─────────────────────────────────────────────────
    {
      testName: 'Gram Stain',
      category: 'Microbiology',
      parameters: [
        {name: 'Pus Cells', unit: '/hpf', normalRange: '0-2'},
        {name: 'Epithelial Cells', unit: '/hpf', normalRange: 'Few'},
        {name: 'Organisms', normalRange: 'No organisms seen'},
      ],
    },
    // ── 64. Urine Pregnancy Test ───────────────────────────────────────
    {
      testName: 'Urine Pregnancy Test',
      category: 'Urinalysis',
      parameters: [
        {name: 'Urine hCG', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
      ],
    },
    // ── 65. 24-Hour Urine Protein ──────────────────────────────────────
    {
      testName: '24-Hour Urine Protein',
      category: 'Urinalysis',
      parameters: [
        {name: '24-Hour Volume', unit: 'mL/24hr', normalRange: '800-2000'},
        {name: 'Total Protein (24hr)', unit: 'mg/24hr', normalRange: '< 150'},
      ],
    },
    // ── 66. CSF Analysis ───────────────────────────────────────────────
    {
      testName: 'CSF Analysis',
      category: 'Special',
      parameters: [
        {name: 'Appearance', normalRange: 'Clear, Colorless'},
        {name: 'Protein', unit: 'mg/dL', normalRange: '15-45'},
        {name: 'Glucose', unit: 'mg/dL', normalRange: '40-70'},
        {name: 'Total Cell Count', unit: '/cumm', normalRange: '0-5'},
        {name: 'Lymphocytes', unit: '%', normalRange: '100'},
        {name: 'Polymorphs', unit: '%', normalRange: '0'},
      ],
    },
    // ── 67. Pleural Fluid Analysis ─────────────────────────────────────
    {
      testName: 'Pleural Fluid Analysis',
      category: 'Special',
      parameters: [
        {name: 'Appearance', normalRange: 'Clear, Pale Yellow'},
        {name: 'Total Protein', unit: 'g/dL', normalRange: '< 3.0'},
        {name: 'Glucose', unit: 'mg/dL', normalRange: 'Same as blood'},
        {name: 'LDH', unit: 'U/L', normalRange: '< 200'},
        {name: 'Total Cell Count', unit: '/cumm', normalRange: '< 1000'},
      ],
    },
    // ── 68. Ascitic Fluid Analysis ─────────────────────────────────────
    {
      testName: 'Ascitic Fluid Analysis',
      category: 'Special',
      parameters: [
        {name: 'Appearance', normalRange: 'Clear, Yellow'},
        {name: 'Total Protein', unit: 'g/dL', normalRange: '< 2.5'},
        {name: 'Albumin', unit: 'g/dL', normalRange: '< 1.1'},
        {name: 'SAAG', unit: 'g/dL', normalRange: '> 1.1'},
        {name: 'Total Cell Count', unit: '/cumm', normalRange: '< 500'},
      ],
    },
    // ── 69. Synovial Fluid Analysis ────────────────────────────────────
    {
      testName: 'Synovial Fluid Analysis',
      category: 'Special',
      parameters: [
        {name: 'Appearance', normalRange: 'Clear, Pale Yellow'},
        {name: 'Viscosity', normalRange: 'High'},
        {name: 'Mucin Clot', normalRange: 'Good'},
        {name: 'Total Cell Count', unit: '/cumm', normalRange: '< 200'},
        {name: 'Crystals', normalRange: 'Not Seen'},
      ],
    },
    // ── 70. Semen Analysis ─────────────────────────────────────────────
    {
      testName: 'Semen Analysis',
      category: 'Special',
      parameters: [
        {name: 'Volume', unit: 'mL', normalRange: '>= 1.5', section: 'Physical'},
        {name: 'Color', normalRange: 'Greyish White', section: 'Physical'},
        {name: 'Liquefaction Time', unit: 'Minutes', normalRange: '< 60', section: 'Physical'},
        {name: 'pH', normalRange: '>= 7.2', section: 'Physical'},
        {name: 'Sperm Count', unit: 'Millions/mL', normalRange: '>= 15', section: 'Microscopic'},
        {name: 'Total Motility', unit: '%', normalRange: '>= 40', section: 'Microscopic'},
        {name: 'Progressive Motility', unit: '%', normalRange: '>= 32', section: 'Microscopic'},
        {name: 'Normal Morphology', unit: '%', normalRange: '>= 4', section: 'Microscopic'},
        {name: 'Pus Cells', unit: '/hpf', normalRange: '< 1', section: 'Microscopic'},
      ],
    },
    // ── 71. Tmt (Troponin T/I Rapid) ───────────────────────────────────
    {
      testName: 'Troponin T/I Rapid',
      category: 'Cardiology',
      parameters: [
        {
          name: 'Troponin T / I',
          normalRange: 'Negative',
          inputType: "dropdown",
          dropdownOptions: ['Negative', 'Positive'],
        },
      ],
    },
    // ── 72. PSA (Total) ────────────────────────────────────────────────
    {
      testName: 'PSA (Total)',
      category: 'Tumor Markers',
      parameters: [
        {name: 'Total PSA', unit: 'ng/mL', normalRange: '< 4.0'},
      ],
    },
    // ── 73. CA-125 ─────────────────────────────────────────────────────
    {
      testName: 'CA-125',
      category: 'Tumor Markers',
      parameters: [
        {name: 'CA-125', unit: 'U/mL', normalRange: '< 35.0'},
      ],
    },
    // ── 74. CA 19-9 ────────────────────────────────────────────────────
    {
      testName: 'CA 19-9',
      category: 'Tumor Markers',
      parameters: [
        {name: 'CA 19-9', unit: 'U/mL', normalRange: '< 37.0'},
      ],
    },
    // ── 75. CEA ────────────────────────────────────────────────────────
    {
      testName: 'CEA',
      category: 'Tumor Markers',
      parameters: [
        {name: 'Carcino Embryonic Antigen-CEA', unit: 'ng/mL', normalRange: 'Non-smokers: 0-3 | Smokers: 0-5'},
      ],
    },
    // ── 76. AFP (Alpha Fetoprotein) ────────────────────────────────────
    {
      testName: 'AFP (Alpha Fetoprotein)',
      category: 'Tumor Markers',
      parameters: [
        {name: 'Alpha Fetoprotein (AFP)', unit: 'IU/mL', normalRange: '< 5.8'},
      ],
    },
    // ── 77. Procalcitonin ──────────────────────────────────────────────
    {
      testName: 'Procalcitonin',
      category: 'Miscellaneous',
      parameters: [
        {name: 'Procalcitonin (PCT)', unit: 'ng/mL', normalRange: '< 0.05'},
      ],
    },
    // ── 78. Vitamin D3 (25-OH) ──────────────────────────────────────────
    {
      testName: 'Vitamin D3 (25-OH)',
      category: 'Miscellaneous',
      parameters: [
        {name: '25-Hydroxy Vitamin D', unit: 'ng/mL', normalRange: '30-100'},
      ],
    },
    // ── 79. Vitamin B12 ────────────────────────────────────────────────
    {
      testName: 'Vitamin B12',
      category: 'Miscellaneous',
      parameters: [
        {name: 'Vitamin B12', unit: 'pg/mL', normalRange: '197-771'},
      ],
    },
    // ── 80. HbS Solubility (Sickle Cell) ───────────────────────────────
    {
      testName: 'HbS Solubility (Sickle Cell)',
      category: 'Miscellaneous',
      parameters: [
        {name: 'HbS Solubility Test', normalRange: 'Negative', inputType: "dropdown", dropdownOptions: ['Negative', 'Positive']},
      ],
    },
    // ── 81. Mantoux Test (Tuberculin Skin Test) ─────────────────────────
    {
      testName: 'Mantoux Test',
      category: 'Microbiology',
      parameters: [
        {
          name: 'Induration Size',
          unit: 'mm',
          normalRange: '< 10',
        },
        {
          name: 'Result',
          normalRange: 'Negative',
          inputType: "dropdown",
          dropdownOptions: ['Negative', 'Positive'],
        },
      ],
    },
    // ── 83. CSF / Pleural / Ascitic / Synovial Fluid ───────────────────
    {
      testName: 'CSF/ Pleural/ Ascitic/ Synovial Fluid',
      category: 'Special',
      parameters: [
        {name: 'Colour', section: 'Physical Examination'},
        {name: 'Quantity', unit: 'ml', section: 'Physical Examination'},
        {name: 'Appearance', section: 'Physical Examination'},
        {name: 'Coagulum/ Clot', section: 'Physical Examination'},
        {name: 'Blood', section: 'Physical Examination'},
        {name: 'Pus', section: 'Physical Examination'},
        {name: 'Sugar', unit: 'mg/dL', normalRange: '50-80', section: 'Chemical Examination'},
        {name: 'Protein', unit: 'mg/dL', normalRange: '30-90', section: 'Chemical Examination'},
        {name: 'Total Count', unit: 'cells/cumm', section: 'Microscopic Examination'},
        {name: 'Polymorphonuclear cells', unit: '%', section: 'Differential Count'},
        {name: 'Lymphocytes', unit: '%', section: 'Differential Count'},
        {name: 'Eosinophils', unit: '%', section: 'Differential Count'},
        {name: 'Macrophages', unit: '%', section: 'Differential Count'},
        {name: 'Mesothelial cells', unit: '%', section: 'Differential Count'},
        {name: 'Epithelial cells', unit: '%', section: 'Differential Count'},
        {name: 'Atypical cells', unit: '%', section: 'Differential Count'},
        {name: 'Malignant cells', unit: '%', section: 'Differential Count'},
        {name: 'RBCs', unit: '%', section: 'Differential Count'},
        {name: 'Others', unit: '%', section: 'Differential Count'},
      ],
    },
    // ── 82. CRP Qualitative ────────────────────────────────────────────
    {
      testName: 'CRP Qualitative',
      category: 'Biochemistry',
      parameters: [
        {
          name: 'CRP (Qualitative)',
          normalRange: 'Negative',
          inputType: "dropdown",
          dropdownOptions: ['Negative', 'Positive'],
        },
      ],
    },
  ];

/** Distinct section names in order of appearance for a template. */
export function templateSections(t: LabTestTemplate): (string | undefined)[] {
  const seen = new Set<string | undefined>();
  const result: (string | undefined)[] = [];
  for (const p of t.parameters) {
    if (!seen.has(p.section)) {
      seen.add(p.section);
      result.push(p.section);
    }
  }
  return result;
}

/** Distinct categories across all templates. */
export const TEST_CATEGORIES: string[] = Array.from(
  new Set(LAB_TEST_TEMPLATES.map((t) => t.category)),
);
