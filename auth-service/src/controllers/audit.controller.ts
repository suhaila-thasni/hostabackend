import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import AuditLog from '../models/auditLog.model';

// @route   GET /auth/audit-logs/:hospitalId
// @desc    Get audit logs for a hospital
// @access  Private
export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { hospitalId } = req.params;
  const { role, status, riskLevel, page = '1', limit = '10' } = req.query;

  const whereClause: any = {
    hospitalId: parseInt(hospitalId as string),
  };

  if (role) whereClause.role = role;
  if (status) whereClause.status = status;
  if (riskLevel) whereClause.riskLevel = riskLevel;

  const pageStr = (page as string) || '1';
  const limitStr = (limit as string) || '10';
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
