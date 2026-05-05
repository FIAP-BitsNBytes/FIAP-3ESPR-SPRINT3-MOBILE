export interface Appointment {
  id: string;
  patientId: string;
  nutritionistId: string;
  date: Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  type: 'CONSULTA' | 'RETORNO';
}

export interface MealPlan {
  id: string;
  patientId: string;
  date: Date;
  meals: Meal[];
}

export interface Meal {
  time: string;
  description: string;
  items: string[];
  completed: boolean;
}
