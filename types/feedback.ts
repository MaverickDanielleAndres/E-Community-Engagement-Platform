export interface FormField {
  id: string;
  type: 'rating' | 'textarea' | 'text' | 'select' | 'checkbox' | 'email';
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  rows?: number;
  options?: {
    max?: number;
    labels?: string[];
    emojis?: string[];
    choices?: string[];
  };
}

export interface FormTemplate {
  id: string;
  title: string;
  subtitle: string;
  fields: FormField[];
}

export type FormConfig = FormField[];

export interface DynamicFeedback {
  id: string;
  rating?: number;  // Legacy support
  comment?: string;  // Legacy support
  form_data?: Record<string, any>;
  resolved_details?: string;
  created_at: string;
  users: { name: string; email: string };
}
