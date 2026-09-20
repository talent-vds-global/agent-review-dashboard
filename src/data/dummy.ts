import type { RoleType } from './mock';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: RoleType;
  roleTitle: string;
  department: string;
  initials: string;
  avatarBgColor?: string;
}

export interface UserAccount extends UserProfile {
  passwordPlainText: string; // Sử dụng để kiểm tra xác thực giả lập
}

/**
 * 4 tài khoản mẫu tương ứng với 4 vai trò trong hệ thống QC PORTAL.
 * Khi kết nối API thật, backend sẽ cấp dữ liệu tương đương qua JWT token hoặc session.
 */
export const DUMMY_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr_dev_01',
    username: 'dev',
    email: 'dev@qcportal.io',
    passwordPlainText: 'dev123',
    fullName: 'Nguyễn Văn Backend',
    role: 'developer',
    roleTitle: 'Developer (Backend Core)',
    department: 'Core Platform & Architecture Team',
    initials: 'DV',
    avatarBgColor: '#E5342A',
  },
  {
    id: 'usr_lead_02',
    username: 'leader',
    email: 'leader@qcportal.io',
    passwordPlainText: 'lead123',
    fullName: 'Trần Thị Thu Leader',
    role: 'leader',
    roleTitle: 'Developer Leader (Tech Lead)',
    department: 'Architecture & Release Governance',
    initials: 'LD',
    avatarBgColor: '#111111',
  },
  {
    id: 'usr_test_03',
    username: 'tester',
    email: 'tester@qcportal.io',
    passwordPlainText: 'test123',
    fullName: 'Lê Thị Mai QA',
    role: 'tester',
    roleTitle: 'Tester (QA Automation)',
    department: 'Quality Assurance & Automated Testing',
    initials: 'TS',
    avatarBgColor: '#2563EB',
  },
  {
    id: 'usr_ops_04',
    username: 'ops',
    email: 'ops@qcportal.io',
    passwordPlainText: 'ops123',
    fullName: 'Phạm Hùng DevOps',
    role: 'operator',
    roleTitle: 'Operator (SRE / DevOps)',
    department: 'Site Reliability Engineering (SRE)',
    initials: 'OP',
    avatarBgColor: '#059669',
  },
];

export function findUserByUsername(username: string): UserAccount | undefined {
  const normalized = username.trim().toLowerCase();
  return DUMMY_ACCOUNTS.find(
    (u) => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized
  );
}
