import AuditLog from '../models/auditLog.model';
import geoip from 'geoip-lite';
import { Request } from 'express';
import { AUDIT_EXCLUDED_ROLES } from '../constants/audit.constants';

interface CreateAuditLogParams {
  req: Request;
  authId?: number;
  name: string;
  role: string;
  department?: string;
  hospitalId?: number;
  status: string; // 'Active', 'Inactive', 'Failed'
  riskLevel?: string; // 'Low', 'Medium', 'High'
  loginMethod?: string;
}

export const createAuditLog = async (params: CreateAuditLogParams) => {
  const role = params.role?.toUpperCase();

  if (role && AUDIT_EXCLUDED_ROLES.includes(role)) {
    return;
  }

  try {
    const forwarded = params.req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0].trim() || params.req.ip || '127.0.0.1';
    
    const deviceBrowser = params.req.headers['user-agent'] || 'Unknown';
    
    // Parse IP for geo location
    const geo = geoip.lookup(ip);
    const location = geo ? `${geo.city}, ${geo.country}` : 'Unknown';

    const auditLog = await AuditLog.create({
      authId: params.authId,
      name: params.name,
      role, // use the normalized role
      department: params.department,
      hospitalId: params.hospitalId,
      deviceBrowser,
      ipAddress: ip,
      location,
      status: params.status,
      riskLevel: params.riskLevel || 'Low',
      loginMethod: params.loginMethod || 'Password',
    });

    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw, we don't want to break the login flow if audit logging fails
  }
};

export const updateAuditLogOnLogout = async (authId: number) => {
  try {
    // Find the most recent active session for this user
    const auditLog = await AuditLog.findOne({
      where: {
        authId,
        status: 'Active'
      },
      order: [['createdAt', 'DESC']]
    });

    if (auditLog) {
      const now = new Date();
      const loginTime = new Date(auditLog.loginTime);
      const diffMs = now.getTime() - loginTime.getTime();
      
      // Calculate duration like "2h 45m" or "5m"
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      
      let sessionDuration = '';
      if (diffHrs > 0) {
        sessionDuration += `${diffHrs}h `;
      }
      sessionDuration += `${diffMins}m`;
      if (diffHrs === 0 && diffMins === 0) {
        sessionDuration = '< 1m';
      }

      await auditLog.update({
        status: 'Inactive',
        lastActivity: now,
        sessionDuration: sessionDuration.trim()
      });
    }
  } catch (error) {
    console.error('Error updating audit log on logout:', error);
  }
};
