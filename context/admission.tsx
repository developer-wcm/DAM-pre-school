import React, { createContext, useContext, useState } from 'react';

export type Gender = 'Male' | 'Female';
export type TCGrade = 'JUNIOR_KG' | 'SENIOR_KG' | null;

export interface ParentFields {
  fullName: string;
  phone: string;
  occupation: string;
  workLocation: string;
  email: string;
}

export interface UploadedFile {
  uri: string;
  name: string;
  type: 'image' | 'file';
}

export interface AdmissionData {
  // Step 1: Student Information
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  gender: Gender | null;
  motherTongue: string;
  nationality: string;
  address: string;
  aadhaar: string;

  // Step 2: Parent Information
  father: ParentFields;
  mother: ParentFields;
  guardian: ParentFields;
  guardianExpanded: boolean;

  // Step 3: Class & Academic Details
  admissionDate: string;
  selectedClass: string;
  paymentCycle: string;
  autoReminders: boolean;
  discountEnabled: boolean;

  // Step 4: Document Upload
  files: Record<string, UploadedFile>;
  tcGrade: TCGrade;
}

const INITIAL_ADMISSION_DATA: AdmissionData = {
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  gender: null,
  motherTongue: '',
  nationality: '',
  address: '',
  aadhaar: '',
  father: { fullName: '', phone: '', occupation: '', workLocation: '', email: '' },
  mother: { fullName: '', phone: '', occupation: '', workLocation: '', email: '' },
  guardian: { fullName: '', phone: '', occupation: '', workLocation: '', email: '' },
  guardianExpanded: false,
  admissionDate: '06/01/2025',
  selectedClass: 'Junior KG',
  paymentCycle: 'Monthly',
  autoReminders: true,
  discountEnabled: false,
  files: {},
  tcGrade: null,
};

interface AdmissionContextType {
  admissionData: AdmissionData;
  updateAdmissionData: (data: Partial<AdmissionData>) => void;
  resetAdmissionData: () => void;
}

const AdmissionContext = createContext<AdmissionContextType | null>(null);

export function AdmissionProvider({ children }: { children: React.ReactNode }) {
  const [admissionData, setAdmissionData] = useState<AdmissionData>(INITIAL_ADMISSION_DATA);

  const updateAdmissionData = (data: Partial<AdmissionData>) => {
    setAdmissionData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const resetAdmissionData = () => {
    setAdmissionData(INITIAL_ADMISSION_DATA);
  };

  return (
    <AdmissionContext.Provider value={{ admissionData, updateAdmissionData, resetAdmissionData }}>
      {children}
    </AdmissionContext.Provider>
  );
}

export function useAdmission() {
  const context = useContext(AdmissionContext);
  if (!context) {
    throw new Error('useAdmission must be used within an AdmissionProvider');
  }
  return context;
}
