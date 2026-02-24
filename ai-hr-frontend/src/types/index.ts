export interface User {
  id: string; email: string; name: string; orgId: string;
  roles: string[]; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; createdAt: string;
}

export interface Organization {
  id: string; name: string; slug: string; industry?: string; size?: string;
  timezone: string; currency: string; logoUrl?: string; website?: string; phone?: string;
  address?: Record<string, unknown>;
  _count?: { employees: number; departments: number; locations: number };
}

export interface SetupProgress {
  percentage: number; completed: number; total: number;
  checks: Array<{ key: string; label: string; done: boolean }>;
}

export interface LegalEntity {
  id: string; name: string; registrationNo?: string;
  gstNo?: string; panNo?: string; tanNo?: string;
  _count?: { locations: number };
}

export interface Location {
  id: string; name: string; code?: string;
  type?: 'HQ' | 'BRANCH' | 'REMOTE' | 'WAREHOUSE';
  legalEntityId?: string; timezone?: string; address?: Record<string, unknown>;
}

export interface Department {
  id: string; name: string; code?: string; parentId?: string;
  locationId?: string; headEmployeeId?: string; location?: Location;
  _count?: { children: number; employees: number }; children?: Department[];
}

export interface Employee {
  id: string; employeeId: string; orgId: string; userId?: string;
  firstName: string; lastName: string; email: string; phone?: string;
  designation?: string; departmentId?: string; department?: Department;
  locationId?: string; location?: Location;
  reportingManagerId?: string; manager?: Employee;
  dateOfJoining: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  gender?: 'MALE' | 'FEMALE' | 'OTHER'; profilePicUrl?: string;
}

export interface LeaveType {
  id: string; name: string; code: string; isPaid: boolean;
  maxDaysPerYear: number; carryForward: boolean; color?: string; isActive: boolean;
}

export interface LeaveBalance {
  id: string; leaveTypeId: string; leaveType: LeaveType;
  balance: number; used: number; pending: number; year: number;
}

export interface LeaveApplication {
  id: string; employeeId: string; employee?: Employee;
  leaveTypeId: string; leaveType?: LeaveType;
  startDate: string; endDate: string; days: number; reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string; reviewedAt?: string; remarks?: string; createdAt: string;
}

export interface AttendanceRecord {
  id: string; employeeId: string; employee?: Employee;
  date: string; checkIn?: string; checkOut?: string;
  workMinutes?: number; isRemote?: boolean;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'WFH' | 'HOLIDAY' | 'WEEKEND';
}

export interface Shift {
  id: string; name: string; startTime: string; endTime: string;
  workHours: number; breakMinutes?: number; graceMinutes?: number;
  color?: string; type: 'FIXED' | 'FLEXIBLE' | 'ROTATIONAL';
}

export interface PayrollRun {
  id: string; month: number; year: number;
  status: 'DRAFT' | 'PROCESSING' | 'COMPUTED' | 'APPROVED' | 'PAID';
  totalGross: number; totalNet: number; totalDeductions: number;
  totalEmployees: number; createdAt: string;
}

export interface Payslip {
  id: string; employeeId: string; employee?: Employee;
  payrollRunId: string; month: number; year: number;
  basicSalary: number; grossSalary: number; netSalary: number;
  totalDeductions: number; lopDays: number;
  earnings?: Record<string, number>; deductions?: Record<string, number>;
}

export interface SalaryTemplate {
  id: string; name: string; ctc: number; components: SalaryComponent[];
}

export interface SalaryComponent {
  name: string; type: 'EARNING' | 'DEDUCTION';
  calculationType: 'FIXED' | 'PERCENTAGE';
  value: number; basedOn?: string; isStatutory: boolean;
}

export interface JobRequisition {
  id: string; title: string; departmentId?: string; department?: Department;
  locationId?: string; status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ON_HOLD';
  openings: number; employmentType: string;
  experienceMin?: number; experienceMax?: number; description?: string; createdAt: string;
  _count?: { applications: number };
}

export interface Candidate {
  id: string; name: string; email: string; phone?: string;
  currentCompany?: string; currentDesignation?: string;
  experience?: number; skills?: string[]; linkedInUrl?: string; resumeUrl?: string;
  status: 'ACTIVE' | 'BLACKLISTED' | 'HIRED'; createdAt: string;
}

export interface Application {
  id: string; candidateId: string; candidate?: Candidate;
  jobId: string; job?: JobRequisition;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED'; createdAt: string;
}

export interface Meeting {
  id: string; title: string; description?: string;
  startTime: string; endTime: string; location?: string; meetingLink?: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  participants: MeetingParticipant[]; organizer?: User;
}

export interface MeetingParticipant {
  userId: string; user?: User; status: 'ACCEPTED' | 'DECLINED' | 'PENDING';
}

export interface Grievance {
  id: string; subject: string; description: string; category?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  raisedBy?: Employee; assignedTo?: User; resolution?: string; createdAt: string;
}

export interface Role {
  id: string; name: string; description?: string; isSystem: boolean;
  _count?: { users: number };
}

export interface Permission {
  id: string; name: string; module: string; action: string; description?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number; page: number; limit: number;
    totalPages: number; hasNextPage: boolean; hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean; data: T; meta: { requestId: string; timestamp: string };
}
