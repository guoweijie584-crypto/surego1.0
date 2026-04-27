'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-applications');

function normalizeApplication(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    activityId: item.activityId || item.activity_id,
    userId: item.userId || item.user_id,
    reviewNote: item.reviewNote || item.review_note || '',
    rejectReason: item.rejectReason || item.reject_reason || '',
    reviewerId: item.reviewerId || item.reviewer_id || '',
    createdAt: item.createdAt || item.created_at,
    reviewedAt: item.reviewedAt || item.reviewed_at
  };
}

function normalizeList(result) {
  return (result.data || []).map(normalizeApplication);
}

function buildRecord(payload) {
  const record = {
    ...payload,
    activityId: String(payload.activityId || payload.activity_id),
    activity_id: String(payload.activityId || payload.activity_id),
    userId: payload.userId || payload.user_id || 'mock_user',
    user_id: payload.userId || payload.user_id || 'mock_user'
  };
  if (!record.id) delete record.id;
  return record;
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  if (action === 'submit') {
    const application = buildRecord({
      ...payload,
      status: payload.status || 'pending',
      created_at: Date.now()
    });
    const result = await collection.add(application);
    return {
      code: 0,
      data: normalizeApplication({
        ...application,
        id: result.id
      })
    };
  }

  if (action === 'listByActivity') {
    const activityId = String(payload.activityId || payload.activity_id);
    const result = await collection.where({ activityId }).orderBy('created_at', 'desc').get();
    return {
      code: 0,
      data: normalizeList(result)
    };
  }

  if (action === 'review') {
    const reviewedAt = Date.now();
    await collection.doc(payload.id).update({
      status: payload.status,
      review_note: payload.reviewNote || payload.review_note || '',
      reject_reason: payload.rejectReason || payload.reject_reason || '',
      reviewer_id: payload.reviewerId || payload.reviewer_id || '',
      reviewed_at: reviewedAt
    });
    return {
      code: 0,
      data: normalizeApplication({
        id: payload.id,
        status: payload.status,
        reviewNote: payload.reviewNote || payload.review_note || '',
        rejectReason: payload.rejectReason || payload.reject_reason || '',
        reviewerId: payload.reviewerId || payload.reviewer_id || '',
        reviewed_at: reviewedAt
      })
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
