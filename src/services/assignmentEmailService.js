//
// Dev3 Week 1 - Email notification placeholder for Assignment
// TODO: Integrate with actual email service (nodemailer, SendGrid, etc.)
//

/**
 * Send email when device is assigned to user
 * @param {Object} options - { assigneeEmail, assigneeName, deviceName, assignedBy }
 */
exports.sendAssignmentNotification = async (options) => {
  // Placeholder - integrate with email service when available
  console.log('[AssignmentEmail] Would send assignment notification to:', options?.assigneeEmail, 'for device:', options?.deviceName);
  return Promise.resolve();
};

/**
 * Send email when assignment is acknowledged
 * @param {Object} options - { assignerEmail, deviceName, acknowledgedBy }
 */
exports.sendAcknowledgmentNotification = async (options) => {
  console.log('[AssignmentEmail] Would send acknowledgment notification to:', options?.assignerEmail);
  return Promise.resolve();
};

/**
 * Send email when device is unassigned/returned
 * @param {Object} options - { assigneeEmail, deviceName, returnedBy }
 */
exports.sendUnassignNotification = async (options) => {
  console.log('[AssignmentEmail] Would send unassign notification to:', options?.assigneeEmail);
  return Promise.resolve();
};
