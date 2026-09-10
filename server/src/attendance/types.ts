export interface AttendanceRecord {
  id: number;
  employeeId: string;
  site: string;
  clockIn: string;
  clockOut: string | null;
  hours: string | null;
  geofence: string;
  photo: string;
  status: string;
  attendanceStatus: string;
  remarks: string | null;
  logDate: string;
  createdAt: Date | null;
}

export interface CreateAttendanceInput {
  employeeId: string;
  site: string;
  clockIn: string;
  clockOut?: string;
  geofence?: string;
  photo?: string;
  status?: string;
  attendanceStatus?: string;
  remarks?: string;
  logDate: string;
}

export interface UpdateAttendanceInput extends Partial<CreateAttendanceInput> {}

export interface AttendanceFilters {
  employeeId?: string;
  status?: string; // attendanceStatus: Present | Absent | Late | On Leave | Half Day
  dateFrom?: string;
  dateTo?: string;
}
