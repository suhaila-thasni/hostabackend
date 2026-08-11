import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import AuditLog from '../models/auditLog.model';
import { Op } from 'sequelize';
import { AUDIT_INCLUDED_ROLES } from '../constants/audit.constants';

// ── Helper to ensure single string from query param ──
const getQueryString = (queryParam: any): string | undefined => {
    if (Array.isArray(queryParam)) {
        return queryParam[0] as string;
    }
    return queryParam as string | undefined;
};

// @route   GET /auth/audit-logs/:hospitalId
// @desc    Get audit logs for a hospital
// @access  Private
export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { hospitalId } = req.params;
  
  const pageStr = getQueryString(req.query.page) || '1';
  const limitStr = getQueryString(req.query.limit) || '10';
  const role = getQueryString(req.query.role);
  let status = getQueryString(req.query.status);
  let riskLevel = getQueryString(req.query.riskLevel);
  const search = getQueryString(req.query.search);
  const department = getQueryString(req.query.department);
  const startDate = getQueryString(req.query.startDate);
  const endDate = getQueryString(req.query.endDate);

  const whereClause: any = {
    hospitalId: parseInt(hospitalId as string),
    role: {
      [Op.in]: AUDIT_INCLUDED_ROLES
    }
  };

  if (role) {
    const normalizedRole = role.toUpperCase();
    if (AUDIT_INCLUDED_ROLES.includes(normalizedRole)) {
        whereClause.role = normalizedRole;
    }
  }
  
  if (status) {
      status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      whereClause.status = status;
  }

  if (riskLevel) {
      riskLevel = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase();
      whereClause.riskLevel = riskLevel;
  }

  if (department) {
      whereClause.department = { [Op.iLike]: department };
  }

  if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
  }

  if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
          whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
          whereClause.createdAt[Op.lte] = new Date(endDate);
      }
  }

  const offset = (parseInt(pageStr) - 1) * parseInt(limitStr);

  const { count, rows } = await AuditLog.findAndCountAll({
    where: whereClause,
    limit: parseInt(limitStr),
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / parseInt(limitStr)),
    currentPage: parseInt(pageStr),
    data: rows,
  });
});
