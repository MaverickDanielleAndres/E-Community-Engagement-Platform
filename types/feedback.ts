export interface FormField {
  id: string;
  type: 'rating' | 'textarea' | 'text' | 'select' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
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
  created_at: string;
  users: { name: string; email: string };
}
