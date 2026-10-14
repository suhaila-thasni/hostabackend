import { Request, Response } from "express";
import { Op } from "sequelize";
import axios from "axios";
import LeaveRequest from "../models/leaveRequest.model";
import LeaveTemplate from "../models/leaveTemplate.model";
import { publishEvent } from "../events/publisher";
import { logger } from "../utils/logger";

/* =========================================================================
   HELPER: Calculate Total Days between Start and End Date
========================================================================= */
function calculateDays(startDateStr: string, endDateStr: string): number {
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - start.getTime();
    if (isNaN(diffTime) || diffTime < 0) return 1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
}

export const publishLeaveNotification = async (
  action: "REQUESTED" | "STATUS_UPDATED" | "UPDATED" | "CANCELLED" | "DELETED",
  leave: any
) => {
  try {
    let eventName = "";
    let title = "";
    let message = "";
    let severity = "info";
    let recipient = "admin";

    const employeeName = leave.employeeName && leave.employeeName !== "Employee" ? leave.employeeName : "An employee";

    switch (action) {
      case "REQUESTED":
        eventName = "LEAVE_REQUESTED";
        title = "New Leave Request";
        message = `${employeeName} has requested ${leave.leaveType} leave from ${leave.startDate} to ${leave.endDate}.`;
        severity = "info";
        recipient = "admin";
        break;
      case "STATUS_UPDATED":
        eventName = "LEAVE_STATUS_UPDATED";
        if (leave.status === "Approved") {
          title = "Leave Request Approved";
          message = "Your leave request has been approved by the hospital administration.";
          severity = "success";
          recipient = "employee";
        } else if (leave.status === "Rejected") {
          title = "Leave Request Rejected";
          message = "Your leave request has been rejected by the hospital administration. Please check the remarks for more details.";
          severity = "warning";
          recipient = "employee";
        } else if (leave.status === "Cancelled") {
          title = "Leave Request Cancelled";
          message = `${employeeName} has cancelled their leave request. Please review the updated request details.`;
          severity = "warning";
          recipient = "admin";
        } else {
          title = `Leave Request ${leave.status}`;
          message = `Your leave request from ${leave.startDate} to ${leave.endDate} has been ${leave.status.toLowerCase()}.`;
          severity = "info";
          recipient = "employee";
        }
        break;
      case "UPDATED":
        eventName = "LEAVE_UPDATED";
        title = "Leave Request Updated";
        message = `${employeeName} updated their leave request details.`;
        severity = "info";
        recipient = "admin";
        break;
      case "CANCELLED":
        eventName = "LEAVE_CANCELLED";
        title = "Leave Request Cancelled";
        message = `${employeeName} has cancelled their leave request. Please review the updated request details.`;
        severity = "warning";
        recipient = "admin";
        break;
      case "DELETED":
        eventName = "LEAVE_DELETED";
        title = "Leave Request Deleted";
        message = `A leave request for ${employeeName} was deleted by an administrator.`;
        severity = "warning";
        recipient = "employee";
        break;
    }

    const eventPayload = {
      event: eventName,
      title,
      message,
      category: "leave",
      severity,
      recipient,
      data: leave,
      createdAt: new Date(),
    };

    await publishEvent("hospital_events", eventName, eventPayload);
    logger.info(`Successfully published ${eventName} to RabbitMQ for leave ID ${leave.id}`);
  } catch (err: any) {
    logger.error(`Failed to publish ${action} event:`, { error: err.message });
  }
};

/* =========================================================================
   1. APPLY FOR LEAVE (Doctor / Staff submits request)
========================================================================= */
export const applyLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      hospitalId,
      employeeId,
      employeeType,
      leaveType,
      startDate,
      endDate,
      totalDays,
      templateId,
      reasonCategory,
      reason,
      additionalDetails,
      handoverToId,
      handoverToName,
      handoverToType,
      handoverNotes,
      isConfirmed,
    } = req.body;

    const resolvedEmployeeId = Number(employeeId);
    const resolvedHospitalId = Number(hospitalId);
    const resolvedEmployeeType = employeeType || "Staff";

    let staffName = req.body.employeeName || "Employee";
    let staffEmail = req.body.employeeEmail || "";
    let staffDepartment = req.body.department || "";

    // Fetch employee details from microservices if missing
    try {
      if (resolvedEmployeeType.toLowerCase() === "doctor") {
        const doctorResponse = await axios.get(
          `${process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3007"}/doctor/internal/${resolvedEmployeeId}`,
          {
            timeout: 8000,
            validateStatus: () => true,
            headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" },
          }
        );
        if (doctorResponse.status === 200 && doctorResponse.data?.success) {
          const docData = doctorResponse.data.data;
          staffName =
            docData?.displayName ||
            docData?.name ||
            (docData?.firstName ? `${docData.firstName} ${docData.lastName || ""}`.trim() : staffName);
          staffEmail = docData?.email || staffEmail;
          staffDepartment = docData?.department || staffDepartment;
        }
      } else {
        const staffResponse = await axios.get(
          `${process.env.STAFF_SERVICE_URL || "http://staff-service:3006"}/staff/internal/${resolvedEmployeeId}`,
          {
            timeout: 8000,
            validateStatus: () => true,
            headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" },
          }
        );
        if (staffResponse.status === 200 && staffResponse.data?.success) {
          const staffData = staffResponse.data.data;
          staffName = staffData?.name || staffData?.username || staffName;
          staffEmail = staffData?.email || staffEmail;
          staffDepartment = staffData?.department || staffData?.designation || staffDepartment;
        }
      }
    } catch (fetchErr: any) {
      logger.warn("Could not fetch remote employee profile for leave request:", { error: fetchErr.message });
    }

    const calculatedTotalDays = totalDays ? Number(totalDays) : calculateDays(startDate, endDate);

    let finalReasonCategory = reasonCategory || "General";
    let finalTemplateId = templateId ? Number(templateId) : null;

    if (finalTemplateId) {
      const template = await LeaveTemplate.findByPk(finalTemplateId);
      if (template && template.reasonCategory) {
        finalReasonCategory = template.reasonCategory;
      }
    }

    const leave = await LeaveRequest.create({
      hospitalId: resolvedHospitalId,
      employeeId: resolvedEmployeeId,
      employeeType: resolvedEmployeeType,
      employeeName: staffName,
      employeeEmail: staffEmail,
      department: staffDepartment,
      leaveType,
      startDate,
      endDate,
      totalDays: calculatedTotalDays,
      templateId: finalTemplateId,
      reasonCategory: finalReasonCategory,
      reason,
      additionalDetails,
      handoverToId: handoverToId ? Number(handoverToId) : null,
      handoverToName,
      handoverToType: handoverToType || (resolvedEmployeeType === "Doctor" ? "Doctor" : "Staff"),
      handoverNotes,
      isConfirmed: isConfirmed !== false,
      status: "Pending",
      appliedAt: new Date(),
    });

    // Publish event
    await publishLeaveNotification("REQUESTED", leave);

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: leave,
    });
  } catch (error: any) {
    logger.error("Error submitting leave request:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   2. GET LEAVE REQUESTS (With Filters for Admin & Doctor/Staff)
========================================================================= */
export const getLeaveRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const where: any = {};

    if (req.query.hospitalId) where.hospitalId = req.query.hospitalId;
    if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.employeeType) where.employeeType = req.query.employeeType;
    if (req.query.department) where.department = req.query.department;
    if (req.query.leaveType) where.leaveType = req.query.leaveType;

    if (req.query.status && req.query.status !== "All") {
      where.status = req.query.status;
    }

    // Search filter (name, department, leaveType, reason)
    if (req.query.search) {
      const searchTerm = `%${String(req.query.search).trim()}%`;
      where[Op.or] = [
        { employeeName: { [Op.iLike]: searchTerm } },
        { department: { [Op.iLike]: searchTerm } },
        { leaveType: { [Op.iLike]: searchTerm } },
        { reason: { [Op.iLike]: searchTerm } },
      ];
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      where.startDate = { [Op.gte]: String(req.query.startDate) };
      where.endDate = { [Op.lte]: String(req.query.endDate) };
    } else if (req.query.date) {
      where[Op.and] = [
        { startDate: { [Op.lte]: String(req.query.date) } },
        { endDate: { [Op.gte]: String(req.query.date) } },
      ];
    }

    const leaveRequests = await LeaveRequest.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests,
    });
  } catch (error: any) {
    logger.error("Error fetching leave requests:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   3. GET LEAVE STATISTICS (Dashboard Counters: Total, Pending, Approved, Rejected)
========================================================================= */
export const getLeaveStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const where: any = {};
    if (req.query.hospitalId) where.hospitalId = req.query.hospitalId;
    if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.employeeType) where.employeeType = req.query.employeeType;

    const [total, pending, approved, rejected] = await Promise.all([
      LeaveRequest.count({ where }),
      LeaveRequest.count({ where: { ...where, status: "Pending" } }),
      LeaveRequest.count({ where: { ...where, status: "Approved" } }),
      LeaveRequest.count({ where: { ...where, status: "Rejected" } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
      },
    });
  } catch (error: any) {
    logger.error("Error fetching leave stats:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   4. GET SINGLE LEAVE REQUEST BY ID
========================================================================= */
export const getLeaveRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) {
      res.status(404).json({ success: false, message: "Leave request not found" });
      return;
    }
    res.status(200).json({ success: true, data: leave });
  } catch (error: any) {
    logger.error("Error fetching leave request by ID:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   5. ADMIN DECISION: APPROVE OR REJECT LEAVE REQUEST
========================================================================= */
export const updateLeaveStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) {
      res.status(404).json({ success: false, message: "Leave request not found" });
      return;
    }

    const { status, adminComments, actionByName, actionBy } = req.body;

    if (!["Approved", "Rejected", "Pending", "Cancelled"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: 'Approved', 'Rejected', 'Pending', 'Cancelled'",
      });
      return;
    }

    leave.status = status;
    if (adminComments !== undefined) leave.adminComments = adminComments;
    if (actionByName !== undefined) leave.actionByName = actionByName;
    if (actionBy !== undefined) leave.actionBy = actionBy;
    leave.actionDate = new Date();

    await leave.save();

    // Publish event so Notification Service can send alert/email
    await publishLeaveNotification("STATUS_UPDATED", leave);

    res.status(200).json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()} successfully`,
      data: leave,
    });
  } catch (error: any) {
    logger.error("Error updating leave request status:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   6. UPDATE / EDIT LEAVE REQUEST
========================================================================= */
export const updateLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) {
      res.status(404).json({ success: false, message: "Leave request not found" });
      return;
    }

    const updateData = { ...req.body };
    if (updateData.startDate && updateData.endDate && !updateData.totalDays) {
      updateData.totalDays = calculateDays(updateData.startDate, updateData.endDate);
    }

    await leave.update(updateData);
    await publishLeaveNotification("UPDATED", leave);

    res.status(200).json({
      success: true,
      message: "Leave request updated successfully",
      data: leave,
    });
  } catch (error: any) {
    logger.error("Error updating leave request:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   7. CANCEL LEAVE REQUEST (Employee cancels their pending request)
========================================================================= */
export const cancelLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) {
      res.status(404).json({ success: false, message: "Leave request not found" });
      return;
    }

    if (leave.status !== "Pending") {
      res.status(400).json({
        success: false,
        message: `Cannot cancel a leave request that is already ${leave.status.toLowerCase()}`,
      });
      return;
    }

    leave.status = "Cancelled";
    leave.actionDate = new Date();
    await leave.save();
    await publishLeaveNotification("CANCELLED", leave);

    res.status(200).json({
      success: true,
      message: "Leave request cancelled successfully",
      data: leave,
    });
  } catch (error: any) {
    logger.error("Error cancelling leave request:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   8. DELETE LEAVE REQUEST (Admin)
========================================================================= */
export const deleteLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) {
      res.status(404).json({ success: false, message: "Leave request not found" });
      return;
    }

    await leave.destroy();
    await publishLeaveNotification("DELETED", leave);

    res.status(200).json({
      success: true,
      message: "Leave request deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting leave request:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
