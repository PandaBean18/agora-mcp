import db from '../db/sqlite';

export function logAction(
  agentId: string,
  toolName: string,
  intentRationale: string,
  policyCheckStatus: string,
  details: any,
  merchantId?: string,
  razorpayOrderId?: string,
  razorpayPaymentLink?: string
) {
  const insert = db.prepare(`
    INSERT INTO ledger (
      agent_id, tool_name, intent_rationale, policy_check_status, 
      details, merchant_id, razorpay_order_id, razorpay_payment_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    agentId,
    toolName,
    intentRationale,
    policyCheckStatus,
    JSON.stringify(details),
    merchantId || null,
    razorpayOrderId || null,
    razorpayPaymentLink || null
  );

  return result.lastInsertRowid;
}

export function getLedgerEntries(limit = 50) {
  const stmt = db.prepare('SELECT * FROM ledger ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit).map((row: any) => ({
    ...row,
    details: row.details ? JSON.parse(row.details) : null
  }));
}
