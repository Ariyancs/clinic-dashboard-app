export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_time: string | null
          appointment_type: string
          bed_id: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          patient_id: string | null
          status: string | null
        }
        Insert: {
          appointment_time?: string | null
          appointment_type?: string
          bed_id?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Update: {
          appointment_time?: string | null
          appointment_type?: string
          bed_id?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string | null
        }
      }
      beds: {
        Row: {
          bed_number: string
          created_at: string
          id: string
          is_occupied: boolean
          ward_id: string | null
        }
        Insert: {
          bed_number: string
          created_at?: string
          id?: string
          is_occupied?: boolean
          ward_id?: string | null
        }
        Update: {
          bed_number?: string
          created_at?: string
          id?: string
          is_occupied?: boolean
          ward_id?: string | null
        }
      }
      billable_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          rate: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          rate?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          rate?: number
        }
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
      }
      doctors: {
        Row: {
          contact: string | null
          created_at: string | null
          department_id: string | null
          email: string | null
          experience: string | null
          id: string
          name: string
          qualification: string | null
          schedule: string | null
          specialization: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          name: string
          qualification?: string | null
          schedule?: string | null
          specialization?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          name?: string
          qualification?: string | null
          schedule?: string | null
          specialization?: string | null
        }
      }
      invoice_items: {
        Row: {
          actual_rate: number
          commission_amount: number
          commission_percentage: number
          id: string
          invoice_id: string | null
          item_discount_amount: number
          quantity: number
          test_name: string
          unit_price: number
        }
        Insert: {
          actual_rate?: number
          commission_amount?: number
          commission_percentage?: number
          id?: string
          invoice_id?: string | null
          item_discount_amount?: number
          quantity?: number
          test_name: string
          unit_price: number
        }
        Update: {
          actual_rate?: number
          commission_amount?: number
          commission_percentage?: number
          id?: string
          invoice_id?: string | null
          item_discount_amount?: number
          quantity?: number
          test_name?: string
          unit_price?: number
        }
      }
      invoices: {
        Row: {
          appointment_id: string | null
          collection_charge: number
          collector_name: string | null
          created_at: string
          discount: number
          discount_percentage: number
          due_amount: number
          gross_amount: number
          id: string
          invoice_date: string
          invoice_no: string
          is_medical_claim: boolean
          lab_name: string | null
          net_amount: number
          paid_amount: number
          patient_id: string | null
          payment_method: string | null
          referred_by: string | null
          report_id: string | null
          round_off: number
          service_charge: number
          status: string
        }
        Insert: {
          appointment_id?: string | null
          collection_charge?: number
          collector_name?: string | null
          created_at?: string
          discount?: number
          discount_percentage?: number
          due_amount?: number
          gross_amount?: number
          id?: string
          invoice_date?: string
          invoice_no?: string
          is_medical_claim?: boolean
          lab_name?: string | null
          net_amount?: number
          paid_amount?: number
          patient_id?: string | null
          payment_method?: string | null
          referred_by?: string | null
          report_id?: string | null
          round_off?: number
          service_charge?: number
          status?: string
        }
        Update: {
          appointment_id?: string | null
          collection_charge?: number
          collector_name?: string | null
          created_at?: string
          discount?: number
          discount_percentage?: number
          due_amount?: number
          gross_amount?: number
          id?: string
          invoice_date?: string
          invoice_no?: string
          is_medical_claim?: boolean
          lab_name?: string | null
          net_amount?: number
          paid_amount?: number
          patient_id?: string | null
          payment_method?: string | null
          referred_by?: string | null
          report_id?: string | null
          round_off?: number
          service_charge?: number
          status?: string
        }
      }
      medical_records: {
        Row: {
          chief_complaint: string | null
          diagnosis: string | null
          doctor_id: string | null
          history_of_present_illness: string | null
          id: string
          investigation_results: string | null
          past_medical_history: string | null
          patient_id: string | null
          physical_examination_findings: string | null
          prescription: string | null
          treatment_plan: string | null
          visit_date: string
          vitals: Json | null
        }
        Insert: {
          chief_complaint?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          history_of_present_illness?: string | null
          id?: string
          investigation_results?: string | null
          past_medical_history?: string | null
          patient_id?: string | null
          physical_examination_findings?: string | null
          prescription?: string | null
          treatment_plan?: string | null
          visit_date?: string
          vitals?: Json | null
        }
        Update: {
          chief_complaint?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          history_of_present_illness?: string | null
          id?: string
          investigation_results?: string | null
          past_medical_history?: string | null
          patient_id?: string | null
          physical_examination_findings?: string | null
          prescription?: string | null
          treatment_plan?: string | null
          visit_date?: string
          vitals?: Json | null
        }
      }
      patients: {
        Row: {
          address: string | null
          admission_date: string | null
          bill_no: string | null
          country: string | null
          created_at: string | null
          discharge_date: string | null
          dob: string | null
          doctor_incharge_1_id: string | null
          doctor_incharge_2_id: string | null
          emergency_no: string | null
          full_name: string
          gender: string | null
          guardian_address: string | null
          guardian_name: string | null
          guardian_passport_no: string | null
          guardian_relation: string | null
          id: string
          insurance_address: string | null
          insurance_company: string | null
          is_corporate: boolean | null
          passport_no: string | null
          phone_no: string | null
          registration_no: string
          religion: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          bill_no?: string | null
          country?: string | null
          created_at?: string | null
          discharge_date?: string | null
          dob?: string | null
          doctor_incharge_1_id?: string | null
          doctor_incharge_2_id?: string | null
          emergency_no?: string | null
          full_name: string
          gender?: string | null
          guardian_address?: string | null
          guardian_name?: string | null
          guardian_passport_no?: string | null
          guardian_relation?: string | null
          id?: string
          insurance_address?: string | null
          insurance_company?: string | null
          is_corporate?: boolean | null
          passport_no?: string | null
          phone_no?: string | null
          registration_no?: string
          religion?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          bill_no?: string | null
          country?: string | null
          created_at?: string | null
          discharge_date?: string | null
          dob?: string | null
          doctor_incharge_1_id?: string | null
          doctor_incharge_2_id?: string | null
          emergency_no?: string | null
          full_name?: string
          gender?: string | null
          guardian_address?: string | null
          guardian_name?: string | null
          guardian_passport_no?: string | null
          guardian_relation?: string | null
          id?: string
          insurance_address?: string | null
          insurance_company?: string | null
          is_corporate?: boolean | null
          passport_no?: string | null
          phone_no?: string | null
          registration_no?: string
          religion?: string | null
        }
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          full_name?: string | null
          id: string
          role: string
        }
        Update: {
          full_name?: string | null
          id?: string
          role?: string
        }
      }
      wards: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
