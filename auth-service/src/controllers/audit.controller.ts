import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import AuditLog from '../models/auditLog.model';
import { Op } from 'sequelize';
import { AUDIT_INCLUDED_ROLES, AUDIT_EXCLUDED_ROLES } from '../constants/audit.constants';

// ── Helper: single string from query param ──
const getQueryString = (queryParam: any): string | undefined => {
    if (Array.isArray(queryParam)) return queryParam[0] as string;
    return queryParam as string | undefined;
};

// ── Helper: fetch role names assigned to a hospital from the role-service ──
// Returns only names that exist in AUDIT_INCLUDED_ROLES (e.g. DOCTOR, STAFF, USER)
const fetchAssignedRoles = async (hospitalId: number | string): Promise<string[]> => {
    try {
        const response = await axios.get(
            `${process.env.ROLE_SERVICE_URL}/role`,
            {
                params: { hospitalId, limit: 200 },
                headers: { 'x-service-secret': process.env.INTERNAL_SERVICE_SECRET },
                timeout: 5000,
            }
        );
        const roles: any[] = response.data?.data || [];
        // Map role names to uppercase and keep only auditable, non-excluded roles
        return roles
            .map((r: any) => (r.name || '').toUpperCase())
            .filter((name: string) =>
                AUDIT_INCLUDED_ROLES.includes(name) && !AUDIT_EXCLUDED_ROLES.includes(name)
            );
    } catch {
        // If role-service is unreachable, fall back to all auditable roles
        return [...AUDIT_INCLUDED_ROLES];
    }
};

// @route   GET /auth/audit-logs/:hospitalId   (hospitalId ignored for superadmin)
// @desc    Get audit logs
//          • superadmin → all hospitals, only roles assigned per hospital, hospitalId visible in response
//          • hospital   → own hospital only, only roles assigned by that hospital
// @access  Private
export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // ── Resolve caller from gateway header ──
    const userData = req.headers['x-user-data']
        ? JSON.parse(req.headers['x-user-data'] as string)
        : null;

    const callerRole: string = (userData?.role || '').toLowerCase();

    // ── Shared query params ──
    const pageStr    = getQueryString(req.query.page)    || '1';
    const limitStr   = getQueryString(req.query.limit)   || '10';
    const roleFilter = getQueryString(req.query.role);
    let   status     = getQueryString(req.query.status);
    let   riskLevel  = getQueryString(req.query.riskLevel);
    const search     = getQueryString(req.query.search);
    const department = getQueryString(req.query.department);
    const startDate  = getQueryString(req.query.startDate);
    const endDate    = getQueryString(req.query.endDate);

    const whereClause: any = {};

    // ════════════════════════════════════════════════════
    //  SUPERADMIN — all hospitals, roles assigned per hospital
    // ════════════════════════════════════════════════════
    if (callerRole === 'superadmin') {
        // Superadmin sees logs from EVERY hospital.
        // We do NOT filter by hospitalId — all records are returned.
        // Role filter: only auditable roles (no SUPERADMIN / HOSPITAL logs).
        whereClause.role = { [Op.in]: AUDIT_INCLUDED_ROLES };

        // Optional: superadmin can also pass ?hospitalId=X to drill into one hospital
        const filterHospitalId = getQueryString(req.query.hospitalId);
        if (filterHospitalId) {
            // Fetch that hospital's assigned roles and intersect with auditable roles
            const assignedRoles = await fetchAssignedRoles(filterHospitalId);
            whereClause.hospitalId = parseInt(filterHospitalId);
            whereClause.role = assignedRoles.length
                ? { [Op.in]: assignedRoles }
                : { [Op.in]: AUDIT_INCLUDED_ROLES };
        }

    // ════════════════════════════════════════════════════
    //  HOSPITAL — own hospital, only their assigned roles
    // ════════════════════════════════════════════════════
    } else if (callerRole === 'hospital') {
        const { hospitalId } = req.params;
        if (!hospitalId) {
            res.status(400).json({ success: false, message: 'hospitalId param is required.' });
            return;
        }

        // Fetch roles this hospital created from role-service
        const hid = String(hospitalId);
        const assignedRoles = await fetchAssignedRoles(hid);

        whereClause.hospitalId = parseInt(hid);
        whereClause.role = assignedRoles.length
            ? { [Op.in]: assignedRoles }
            : { [Op.in]: AUDIT_INCLUDED_ROLES }; // fallback

    } else {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
    }

    // ── Optional shared filters ──
    if (roleFilter) {
        const normalizedRole = roleFilter.toUpperCase();
        // Only allow narrowing — never allow escalating to excluded roles
        if (AUDIT_INCLUDED_ROLES.includes(normalizedRole) && !AUDIT_EXCLUDED_ROLES.includes(normalizedRole)) {
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
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate)   whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const page   = parseInt(pageStr);
    const limit  = parseInt(limitStr);
    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
        success: true,
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: rows,
    });
});
