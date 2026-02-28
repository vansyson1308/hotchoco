export type StaffRole = 'OWNER' | 'MGR' | 'STAFF';

export const COMMAND_PERMISSIONS: Record<string, StaffRole[]> = {
  '/start': ['OWNER', 'MGR', 'STAFF'],
  '/help': ['OWNER', 'MGR', 'STAFF'],
  '/receive': ['OWNER', 'MGR', 'STAFF'],
  '/done': ['OWNER', 'MGR', 'STAFF'],
  '/sell': ['OWNER', 'MGR', 'STAFF'],
  '/sales': ['OWNER', 'MGR', 'STAFF'],
  '/out': ['OWNER', 'MGR', 'STAFF'],
  '/refund': ['OWNER', 'MGR'],
  '/ks': ['OWNER', 'MGR'],
  '/bctc': ['OWNER'],
  '/expense': ['OWNER', 'MGR'],
  '/settle': ['OWNER'],
  '/return': ['OWNER', 'MGR'],
  '/setrate': ['OWNER'],
  '/export': ['OWNER', 'MGR'],
  '/addstaff': ['OWNER'],
  '/removestaff': ['OWNER'],
  '/settings': ['OWNER'],
  '/setup': ['OWNER'],
  '/analytics': ['OWNER']
};

export function normalizeCommand(input: string): string {
  const command = input.trim().split(/\s+/)[0].toLowerCase();
  return command.startsWith('/') ? command : `/${command}`;
}

export function canAccessCommand(role: StaffRole, commandInput: string): boolean {
  const command = normalizeCommand(commandInput);
  const allowedRoles = COMMAND_PERMISSIONS[command];

  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(role);
}
