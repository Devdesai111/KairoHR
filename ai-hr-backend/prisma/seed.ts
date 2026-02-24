import 'dotenv/config';
import { PrismaClient, RoleType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
  { module: 'organization', action: 'view' }, { module: 'organization', action: 'edit' },
  { module: 'employees', action: 'view' }, { module: 'employees', action: 'create' },
  { module: 'employees', action: 'edit' }, { module: 'employees', action: 'delete' },
  { module: 'employees', action: 'export' },
  { module: 'attendance', action: 'view' }, { module: 'attendance', action: 'create' },
  { module: 'attendance', action: 'edit' }, { module: 'attendance', action: 'approve' },
  { module: 'attendance', action: 'report' },
  { module: 'leave', action: 'view' }, { module: 'leave', action: 'apply' },
  { module: 'leave', action: 'approve' }, { module: 'leave', action: 'manage' },
  { module: 'leave', action: 'report' },
  { module: 'payroll', action: 'view' }, { module: 'payroll', action: 'create' },
  { module: 'payroll', action: 'process' }, { module: 'payroll', action: 'approve' },
  { module: 'payroll', action: 'report' },
  { module: 'recruitment', action: 'view' }, { module: 'recruitment', action: 'create' },
  { module: 'recruitment', action: 'edit' }, { module: 'recruitment', action: 'delete' },
  { module: 'recruitment', action: 'interview' },
  { module: 'meetings', action: 'view' }, { module: 'meetings', action: 'create' },
  { module: 'meetings', action: 'edit' }, { module: 'meetings', action: 'delete' },
  { module: 'grievance', action: 'view' }, { module: 'grievance', action: 'create' },
  { module: 'grievance', action: 'manage' }, { module: 'grievance', action: 'resolve' },
  { module: 'reports', action: 'view' }, { module: 'reports', action: 'create' },
  { module: 'reports', action: 'export' },
  { module: 'settings', action: 'view' }, { module: 'settings', action: 'edit' },
  { module: 'ai', action: 'use' }, { module: 'ai', action: 'manage' },
  { module: 'compliance', action: 'view' }, { module: 'compliance', action: 'manage' },
  { module: 'roles', action: 'view' }, { module: 'roles', action: 'manage' },
  { module: 'audit', action: 'view' },
];

const ALL_PERMS = PERMISSIONS.map(p => `${p.module}.${p.action}`);

const ROLE_PERMS: Record<string, string[]> = {
  'Super Admin': ALL_PERMS,
  'Org Admin': ALL_PERMS,
  'HR Admin': [
    'organization.view','organization.edit','employees.view','employees.create','employees.edit','employees.export',
    'attendance.view','attendance.create','attendance.edit','attendance.approve','attendance.report',
    'leave.view','leave.apply','leave.approve','leave.manage','leave.report',
    'payroll.view','payroll.create','payroll.process','payroll.approve','payroll.report',
    'recruitment.view','recruitment.create','recruitment.edit','recruitment.interview',
    'meetings.view','meetings.create','meetings.edit','grievance.view','grievance.manage','grievance.resolve',
    'reports.view','reports.create','reports.export','settings.view','ai.use',
    'compliance.view','compliance.manage','roles.view','audit.view',
  ],
  'HR Executive': [
    'organization.view','employees.view','employees.create','employees.edit',
    'attendance.view','attendance.create','attendance.approve',
    'leave.view','leave.approve','leave.manage','payroll.view',
    'recruitment.view','recruitment.create','recruitment.edit','recruitment.interview',
    'meetings.view','meetings.create','grievance.view','grievance.manage',
    'reports.view','ai.use',
  ],
  'Manager': [
    'organization.view','employees.view','attendance.view','attendance.approve',
    'leave.view','leave.approve','meetings.view','meetings.create','reports.view','ai.use',
  ],
  'Employee': ['attendance.view','attendance.create','leave.view','leave.apply','meetings.view','ai.use'],
};

async function main() {
  console.log('🌱 Seeding database...');

  // Permissions
  const permMap: Record<string, string> = {};
  for (const p of PERMISSIONS) {
    const rec = await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      create: { module: p.module, action: p.action, description: `${p.action} ${p.module}` },
      update: {},
    });
    permMap[`${p.module}.${p.action}`] = rec.id;
  }
  console.log(`✅ ${PERMISSIONS.length} permissions`);

  // Organization
  let org = await prisma.organization.findFirst({ where: { name: 'TechCorp Global' } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'TechCorp Global', industry: 'Technology', size: '100-500', status: 'ACTIVE', email: 'info@techcorp.com' },
    });
  }
  console.log(`✅ Org: ${org.name}`);

  // Roles
  const roleMap: Record<string, string> = {};
  for (const [name, perms] of Object.entries(ROLE_PERMS)) {
    const role = await prisma.role.upsert({
      where: { orgId_name: { orgId: org.id, name } },
      create: { orgId: org.id, name, type: RoleType.SYSTEM, description: `${name} role` },
      update: {},
    });
    roleMap[name] = role.id;
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const rpData = perms.filter(pk => permMap[pk]).map(pk => ({ roleId: role.id, permissionId: permMap[pk] }));
    if (rpData.length) await prisma.rolePermission.createMany({ data: rpData, skipDuplicates: true });
    console.log(`✅ Role: ${name} (${rpData.length} permissions)`);
  }

  // Admin user
  const pwHash = await argon2.hash('Admin@123');
  const admin = await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: 'admin@techcorp.com' } },
    create: { orgId: org.id, email: 'admin@techcorp.com', passwordHash: pwHash, firstName: 'Super', lastName: 'Admin', status: 'ACTIVE', emailVerified: true },
    update: {},
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roleMap['Super Admin'] } },
    create: { userId: admin.id, roleId: roleMap['Super Admin'] },
    update: {},
  });

  const hrAdmin = await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: 'hr@techcorp.com' } },
    create: { orgId: org.id, email: 'hr@techcorp.com', passwordHash: pwHash, firstName: 'HR', lastName: 'Manager', status: 'ACTIVE', emailVerified: true },
    update: {},
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: hrAdmin.id, roleId: roleMap['HR Admin'] } },
    create: { userId: hrAdmin.id, roleId: roleMap['HR Admin'] },
    update: {},
  });
  console.log('✅ Users: admin@techcorp.com, hr@techcorp.com (pw: Admin@123)');

  // Location
  const loc = await prisma.location.findFirst({ where: { orgId: org.id, code: 'HQ' } }) ??
    await prisma.location.create({ data: { orgId: org.id, name: 'Headquarters', code: 'HQ', type: 'HEAD_OFFICE', timezone: 'Asia/Kolkata' } });

  // Departments
  const engDept = await prisma.department.findFirst({ where: { orgId: org.id, code: 'ENG' } }) ??
    await prisma.department.create({ data: { orgId: org.id, name: 'Engineering', code: 'ENG', locationId: loc.id } });
  const hrDept = await prisma.department.findFirst({ where: { orgId: org.id, code: 'HR' } }) ??
    await prisma.department.create({ data: { orgId: org.id, name: 'Human Resources', code: 'HR', locationId: loc.id } });
  console.log('✅ Location & departments');

  // Leave Types
  const leaveTypes = [
    { code: 'CL', name: 'Casual Leave', maxDaysPerYear: 12, isPaid: true, isProRata: true },
    { code: 'SL', name: 'Sick Leave', maxDaysPerYear: 12, isPaid: true, isProRata: false },
    { code: 'EL', name: 'Earned Leave', maxDaysPerYear: 21, isPaid: true, isProRata: true, isEncashable: true, carryForwardMax: 30 },
    { code: 'ML', name: 'Maternity Leave', maxDaysPerYear: 182, isPaid: true, genderRestriction: 'FEMALE' },
    { code: 'PL', name: 'Paternity Leave', maxDaysPerYear: 15, isPaid: true, genderRestriction: 'MALE' },
    { code: 'LWP', name: 'Leave Without Pay', maxDaysPerYear: 365, isPaid: false },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { orgId_code: { orgId: org.id, code: lt.code } },
      create: { orgId: org.id, ...lt },
      update: {},
    });
  }
  console.log('✅ Leave types');

  // Shifts
  const morningShift = await prisma.shift.findFirst({ where: { orgId: org.id, name: 'Morning Shift' } }) ??
    await prisma.shift.create({ data: { orgId: org.id, name: 'Morning Shift', startTime: '09:00', endTime: '18:00', workHours: 8, gracePeriod: 15, color: '#4CAF50' } });
  console.log('✅ Default shift');

  // Sample employees
  const emp1User = await prisma.user.upsert({
    where: { orgId_email: { orgId: org.id, email: 'john.doe@techcorp.com' } },
    create: { orgId: org.id, email: 'john.doe@techcorp.com', passwordHash: pwHash, firstName: 'John', lastName: 'Doe', status: 'ACTIVE', emailVerified: true },
    update: {},
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: emp1User.id, roleId: roleMap['Employee'] } },
    create: { userId: emp1User.id, roleId: roleMap['Employee'] },
    update: {},
  });
  const emp1 = await prisma.employee.findFirst({ where: { orgId: org.id, email: 'john.doe@techcorp.com' } }) ??
    await prisma.employee.create({ data: { orgId: org.id, employeeId: 'TC001', userId: emp1User.id, firstName: 'John', lastName: 'Doe', email: 'john.doe@techcorp.com', designation: 'Senior Engineer', departmentId: engDept.id, locationId: loc.id, dateOfJoining: new Date('2023-01-15'), employmentType: 'FULL_TIME', status: 'ACTIVE' } });

  console.log('\n🎉 Seed complete!');
  console.log('Credentials:');
  console.log('  admin@techcorp.com / Admin@123 (Super Admin)');
  console.log('  hr@techcorp.com / Admin@123 (HR Admin)');
  console.log('  john.doe@techcorp.com / Admin@123 (Employee)');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
