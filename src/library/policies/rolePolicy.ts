type Role = 'root' | 'user';

interface Props {
  userRole: string;
  targetRole?: string | null;
  returnFieldName?: string | null;
  targetReturnFieldName?: string | null;
}

export default function rolePolicy({
  userRole,
  targetRole,
  returnFieldName,
  targetReturnFieldName,
}: Props): API.Success | API.Failure {
  const allowedRoles: Role[] = ['root', 'user'];
  const normalizedUserRole = userRole?.trim().toLowerCase();
  const normalizedTargetRole = targetRole?.trim().toLowerCase();

  if (!normalizedUserRole) {
    return {
      ok: false,
      error: {
        message: "The user's role is required.",
        origin: 'policies',
        method: 'rolePolicy',
        field: returnFieldName ?? 'userRole',
      },
    };
  }

  if (!allowedRoles.includes(normalizedUserRole as Role)) {
    return {
      ok: false,
      error: {
        message: "The user's role is invalid.",
        origin: 'policies',
        method: 'rolePolicy',
        field: returnFieldName ?? 'userRole',
      },
    };
  }

  if (!normalizedTargetRole) {
    return {
      ok: true,
      data: {
        userRole: normalizedUserRole as Role,
      },
    };
  }

  if (!allowedRoles.includes(normalizedTargetRole as Role)) {
    return {
      ok: false,
      error: {
        message: 'The target role is invalid.',
        origin: 'policies',
        method: 'rolePolicy',
        field: targetReturnFieldName ?? 'targetRole',
      },
    };
  }

  if (normalizedUserRole !== normalizedTargetRole) {
    return {
      ok: false,
      error: {
        message: `Access denied, ${normalizedUserRole} role cannot access ${normalizedTargetRole} role resources.`,
        origin: 'policies',
        method: 'rolePolicy',
      },
    };
  }

  return {
    ok: true,
    data: {
      userRole: normalizedUserRole as Role,
      targetRole: normalizedTargetRole as Role,
    },
  };
}
