/**
 * Database Schema Type Definitions
 * Represents the normalized PostgreSQL database schema in Supabase.
 *
 * To regenerate these types automatically from the Supabase CLI:
 * npx supabase gen types typescript --project-id <your-project-id> > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'student' | 'company' | 'admin';
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: 'student' | 'company' | 'admin';
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'student' | 'company' | 'admin';
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_profiles: {
        Row: {
          id: string;
          user_id: string;
          college_name: string;
          degree: string;
          roll_number: string;
          department: string;
          batch_year: number;
          cgpa: number;
          tenth_percentage: number | null;
          twelfth_percentage: number | null;
          active_backlogs: number;
          total_backlogs_cleared: number;
          gender: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          portfolio_url: string | null;
          is_academically_verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          college_name?: string;
          degree?: string;
          roll_number: string;
          department: string;
          batch_year: number;
          cgpa?: number;
          tenth_percentage?: number | null;
          twelfth_percentage?: number | null;
          active_backlogs?: number;
          total_backlogs_cleared?: number;
          gender?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          is_academically_verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          college_name?: string;
          degree?: string;
          roll_number?: string;
          department?: string;
          batch_year?: number;
          cgpa?: number;
          tenth_percentage?: number | null;
          twelfth_percentage?: number | null;
          active_backlogs?: number;
          total_backlogs_cleared?: number;
          gender?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          is_academically_verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_skills: {
        Row: {
          id: string;
          student_id: string;
          name: string;
          category: 'technical' | 'soft' | 'tool' | 'language' | 'other' | null;
          proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          name: string;
          category?: 'technical' | 'soft' | 'tool' | 'language' | 'other' | null;
          proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          category?: 'technical' | 'soft' | 'tool' | 'language' | 'other' | null;
          proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
          created_at?: string;
        };
      };
      student_projects: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          description: string;
          technologies: string[];
          project_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          description: string;
          technologies?: string[];
          project_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          description?: string;
          technologies?: string[];
          project_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_certifications: {
        Row: {
          id: string;
          student_id: string;
          name: string;
          issuing_organization: string;
          issue_date: string | null;
          credential_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          name: string;
          issuing_organization: string;
          issue_date?: string | null;
          credential_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          issuing_organization?: string;
          issue_date?: string | null;
          credential_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_achievements: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          description: string;
          date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          description: string;
          date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          description?: string;
          date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          student_id: string;
          file_name: string;
          storage_path: string;
          file_size_bytes: number;
          mime_type: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          file_name: string;
          storage_path: string;
          file_size_bytes: number;
          mime_type?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          file_name?: string;
          storage_path?: string;
          file_size_bytes?: number;
          mime_type?: string;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          industry: string;
          description: string | null;
          logo_url: string | null;
          company_email: string | null;
          company_phone: string | null;
          location: string | null;
          company_size: string | null;
          founded_year: number | null;
          linkedin_url: string | null;
          company_type: string | null;
          is_verified: boolean;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          industry: string;
          description?: string | null;
          logo_url?: string | null;
          company_email?: string | null;
          company_phone?: string | null;
          location?: string | null;
          company_size?: string | null;
          founded_year?: number | null;
          linkedin_url?: string | null;
          company_type?: string | null;
          is_verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          industry?: string;
          description?: string | null;
          logo_url?: string | null;
          company_email?: string | null;
          company_phone?: string | null;
          location?: string | null;
          company_size?: string | null;
          founded_year?: number | null;
          linkedin_url?: string | null;
          company_type?: string | null;
          is_verified?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      company_users: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          company_id: string;
          created_by: string | null;
          title: string;
          description: string;
          employment_type: 'full_time' | 'internship' | 'internship_to_full_time';
          location: string;
          workplace_type: 'on_site' | 'remote' | 'hybrid';
          ctc_min: number | null;
          ctc_max: number | null;
          ctc_display_text: string | null;
          stipend_monthly: number | null;
          is_salary_disclosed: boolean;
          department: string | null;
          degree: string;
          min_cgpa: number;
          allowed_departments: string[];
          max_active_backlogs: number;
          eligible_batch_years: number[];
          required_skills: string[];
          number_of_openings: number | null;
          selection_process: string | null;
          status: 'draft' | 'published' | 'closed' | 'archived';
          is_approved_by_admin: boolean;
          application_deadline: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          created_by?: string | null;
          title: string;
          description: string;
          employment_type?: 'full_time' | 'internship' | 'internship_to_full_time';
          location: string;
          workplace_type?: 'on_site' | 'remote' | 'hybrid';
          ctc_min?: number | null;
          ctc_max?: number | null;
          ctc_display_text?: string | null;
          stipend_monthly?: number | null;
          is_salary_disclosed?: boolean;
          department?: string | null;
          degree?: string;
          min_cgpa?: number;
          allowed_departments?: string[];
          max_active_backlogs?: number;
          eligible_batch_years?: number[];
          required_skills?: string[];
          number_of_openings?: number | null;
          selection_process?: string | null;
          status?: 'draft' | 'published' | 'closed' | 'archived';
          is_approved_by_admin?: boolean;
          application_deadline: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          created_by?: string | null;
          title?: string;
          description?: string;
          employment_type?: 'full_time' | 'internship' | 'internship_to_full_time';
          location?: string;
          workplace_type?: 'on_site' | 'remote' | 'hybrid';
          ctc_min?: number | null;
          ctc_max?: number | null;
          ctc_display_text?: string | null;
          stipend_monthly?: number | null;
          is_salary_disclosed?: boolean;
          department?: string | null;
          degree?: string;
          min_cgpa?: number;
          allowed_departments?: string[];
          max_active_backlogs?: number;
          eligible_batch_years?: number[];
          required_skills?: string[];
          number_of_openings?: number | null;
          selection_process?: string | null;
          status?: 'draft' | 'published' | 'closed' | 'archived';
          is_approved_by_admin?: boolean;
          application_deadline?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          student_id: string;
          resume_id: string | null;
          status:
            | 'applied'
            | 'withdrawn'
            | 'shortlisted'
            | 'in_review'
            | 'offered'
            | 'rejected';
          cover_note: string | null;
          eligibility_snapshot: Json | null;
          applied_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          student_id: string;
          resume_id?: string | null;
          status?:
            | 'applied'
            | 'withdrawn'
            | 'shortlisted'
            | 'in_review'
            | 'offered'
            | 'rejected';
          cover_note?: string | null;
          eligibility_snapshot?: Json | null;
          applied_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          student_id?: string;
          resume_id?: string | null;
          status?:
            | 'applied'
            | 'withdrawn'
            | 'shortlisted'
            | 'in_review'
            | 'offered'
            | 'rejected';
          cover_note?: string | null;
          eligibility_snapshot?: Json | null;
          applied_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      application_status_history: {
        Row: {
          id: string;
          application_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          remarks: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by?: string | null;
          remarks?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          from_status?: string | null;
          to_status?: string;
          changed_by?: string | null;
          remarks?: string | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_entity: string;
          target_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_entity: string;
          target_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          target_entity?: string;
          target_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
