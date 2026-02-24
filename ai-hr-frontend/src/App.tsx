import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Auth
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'));

// Dashboard
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));

// Organization
const OrganizationPage = React.lazy(() => import('@/pages/organization/OrganizationPage'));
const LegalEntitiesPage = React.lazy(() => import('@/pages/organization/LegalEntitiesPage'));
const LocationsPage = React.lazy(() => import('@/pages/organization/LocationsPage'));
const DepartmentsPage = React.lazy(() => import('@/pages/organization/DepartmentsPage'));
const PoliciesPage = React.lazy(() => import('@/pages/organization/PoliciesPage'));

// Employees
const EmployeeListPage = React.lazy(() => import('@/pages/employees/EmployeeListPage'));
const CreateEmployeePage = React.lazy(() => import('@/pages/employees/CreateEmployeePage'));
const OrgChartPage = React.lazy(() => import('@/pages/employees/OrgChartPage'));
const EmployeeDetailPage = React.lazy(() => import('@/pages/employees/EmployeeDetailPage'));

// Attendance
const AttendancePage = React.lazy(() => import('@/pages/attendance/AttendancePage'));
const ShiftsPage = React.lazy(() => import('@/pages/attendance/ShiftsPage'));
const RegularizationPage = React.lazy(() => import('@/pages/attendance/RegularizationPage'));

// Leave
const LeaveBalancePage = React.lazy(() => import('@/pages/leave/LeaveBalancePage'));
const ApplyLeavePage = React.lazy(() => import('@/pages/leave/ApplyLeavePage'));
const LeaveApprovalsPage = React.lazy(() => import('@/pages/leave/LeaveApprovalsPage'));
const LeaveCalendarPage = React.lazy(() => import('@/pages/leave/LeaveCalendarPage'));
const LeaveTypesPage = React.lazy(() => import('@/pages/leave/LeaveTypesPage'));

// Payroll
const PayrollDashboardPage = React.lazy(() => import('@/pages/payroll/PayrollDashboardPage'));
const SalaryTemplatesPage = React.lazy(() => import('@/pages/payroll/SalaryTemplatesPage'));
const RunPayrollPage = React.lazy(() => import('@/pages/payroll/RunPayrollPage'));
const PayslipsPage = React.lazy(() => import('@/pages/payroll/PayslipsPage'));
const ReimbursementsPage = React.lazy(() => import('@/pages/payroll/ReimbursementsPage'));
const LoansPage = React.lazy(() => import('@/pages/payroll/LoansPage'));

// Recruitment
const JobsPage = React.lazy(() => import('@/pages/recruitment/JobsPage'));
const CandidatesPage = React.lazy(() => import('@/pages/recruitment/CandidatesPage'));
const ApplicationsPage = React.lazy(() => import('@/pages/recruitment/ApplicationsPage'));
const AnalyticsPage = React.lazy(() => import('@/pages/recruitment/AnalyticsPage'));

// Meetings
const MeetingsPage = React.lazy(() => import('@/pages/meetings/MeetingsPage'));
const MeetingCalendarPage = React.lazy(() => import('@/pages/meetings/MeetingCalendarPage'));

// Other modules
const GrievancePage = React.lazy(() => import('@/pages/grievance/GrievancePage'));
const ReportsPage = React.lazy(() => import('@/pages/reports/ReportsPage'));
const SettingsPage = React.lazy(() => import('@/pages/settings/SettingsPage'));
const UserManagementPage = React.lazy(() => import('@/pages/settings/UserManagementPage'));
const RolesPage = React.lazy(() => import('@/pages/settings/RolesPage'));
const AIAssistantPage = React.lazy(() => import('@/pages/ai-assistant/AIAssistantPage'));

const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Organization */}
                <Route path="/organization" element={<OrganizationPage />} />
                <Route path="/organization/legal-entities" element={<LegalEntitiesPage />} />
                <Route path="/organization/locations" element={<LocationsPage />} />
                <Route path="/organization/departments" element={<DepartmentsPage />} />
                <Route path="/organization/policies" element={<PoliciesPage />} />

                {/* Employees */}
                <Route path="/employees" element={<EmployeeListPage />} />
                <Route path="/employees/new" element={<CreateEmployeePage />} />
                <Route path="/employees/org-chart" element={<OrgChartPage />} />
                <Route path="/employees/:id" element={<EmployeeDetailPage />} />

                {/* Attendance */}
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/attendance/shifts" element={<ShiftsPage />} />
                <Route path="/attendance/regularization" element={<RegularizationPage />} />

                {/* Leave */}
                <Route path="/leave" element={<LeaveBalancePage />} />
                <Route path="/leave/apply" element={<ApplyLeavePage />} />
                <Route path="/leave/approvals" element={<LeaveApprovalsPage />} />
                <Route path="/leave/calendar" element={<LeaveCalendarPage />} />
                <Route path="/leave/types" element={<LeaveTypesPage />} />

                {/* Payroll */}
                <Route path="/payroll" element={<PayrollDashboardPage />} />
                <Route path="/payroll/templates" element={<SalaryTemplatesPage />} />
                <Route path="/payroll/runs" element={<RunPayrollPage />} />
                <Route path="/payroll/payslips" element={<PayslipsPage />} />
                <Route path="/payroll/reimbursements" element={<ReimbursementsPage />} />
                <Route path="/payroll/loans" element={<LoansPage />} />

                {/* Recruitment */}
                <Route path="/recruitment" element={<JobsPage />} />
                <Route path="/recruitment/candidates" element={<CandidatesPage />} />
                <Route path="/recruitment/applications" element={<ApplicationsPage />} />
                <Route path="/recruitment/analytics" element={<AnalyticsPage />} />

                {/* Meetings */}
                <Route path="/meetings" element={<MeetingsPage />} />
                <Route path="/meetings/calendar" element={<MeetingCalendarPage />} />

                {/* Other */}
                <Route path="/grievance" element={<GrievancePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/users" element={<UserManagementPage />} />
                <Route path="/settings/roles" element={<RolesPage />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
