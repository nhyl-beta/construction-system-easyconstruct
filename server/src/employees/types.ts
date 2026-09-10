export interface EmployeeRecord {
  id: number;
  employeeId: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  site: string;
  status: string;
  attendanceRate: number;
  performance: string;
  hiredOn: string;
  email: string | null;
  phone: string | null;
  payRate: string;
  rateType: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateEmployeeInput {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  site: string;
  status?: string;
  hiredOn: string;
  email?: string;
  phone?: string;
  payRate?: number | string;
  rateType?: string;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
}
