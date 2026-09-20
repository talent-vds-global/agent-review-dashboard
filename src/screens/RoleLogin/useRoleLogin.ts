import { useCallback, useMemo } from 'react';
import { ROLES, type RoleInfo, type RoleType } from '../../data/mock';

interface UseRoleLoginProps {
  onSelectRole: (role: RoleType) => void;
}

export interface UseRoleLoginReturn {
  roleList: RoleInfo[];
  handleSelectRole: (role: RoleType) => void;
  getRoleById: (roleId: RoleType) => RoleInfo | undefined;
  systemStatus: {
    isLive: boolean;
    text: string;
    version: string;
  };
}

export function useRoleLogin({ onSelectRole }: UseRoleLoginProps): UseRoleLoginReturn {
  const roleList = useMemo(() => Object.values(ROLES), []);

  const handleSelectRole = useCallback(
    (role: RoleType) => {
      onSelectRole(role);
    },
    [onSelectRole]
  );

  const getRoleById = useCallback((roleId: RoleType) => {
    return ROLES[roleId];
  }, []);

  const systemStatus = useMemo(
    () => ({
      isLive: true,
      text: 'RUNTIME MONITORING LIVE',
      version: 'PHIÊN BẢN 2.8.4 · MOCK RUNTIME DATA',
    }),
    []
  );

  return {
    roleList,
    handleSelectRole,
    getRoleById,
    systemStatus,
  };
}
