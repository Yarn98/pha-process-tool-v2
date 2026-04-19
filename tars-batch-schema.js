(function (global) {
  const TARS_BATCH_SCHEMA_V1 = 'tars-batch-v1';
  const TARS_COMPOSITION_SCHEMA_V1 = 'tars-composition-v1';
  const BATCH_STATUSES = new Set(['planning', 'running', 'finalized', 'cancelled']);
  const BATCH_EVENT_KINDS = new Set(['temp_reading', 'addition', 'anomaly', 'scrap', 'note']);
  const BATCH_EVENT_SEVERITIES = new Set(['low', 'medium', 'high']);

  function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function isPositiveNumber(value) {
    return isFiniteNumber(value) && value > 0;
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function isIsoDateLike(value) {
    return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
  }

  function isBatchStateSnapshotV1(value) {
    if (!isRecord(value)) return false;
    if (!Array.isArray(value.zones_c) || !value.zones_c.every(isFiniteNumber)) return false;
    if (!isFiniteNumber(value.rpm)) return false;
    if (value.torque_pct !== undefined && !isFiniteNumber(value.torque_pct)) return false;
    if (value.melt_temp_c !== undefined && !isFiniteNumber(value.melt_temp_c)) return false;
    if (value.die_pressure_bar !== undefined && !isFiniteNumber(value.die_pressure_bar)) return false;
    return true;
  }

  function isBatchCountOrMassV1(value) {
    if (!isRecord(value)) return false;
    const hasCount = value.count !== undefined;
    const hasMass = value.mass_g !== undefined;
    if (!hasCount && !hasMass) return false;
    if (hasCount && !isPositiveNumber(value.count)) return false;
    if (hasMass && !isPositiveNumber(value.mass_g)) return false;
    return true;
  }

  function isBatchAuditEntryV1(value) {
    if (!isRecord(value)) return false;
    if (!isIsoDateLike(value.timestamp)) return false;
    if (!isNonEmptyString(value.action)) return false;
    if (value.actor !== undefined && !isNonEmptyString(value.actor)) return false;
    if (value.note !== undefined && typeof value.note !== 'string') return false;
    return true;
  }

  function isBatchNoteEntryV1(value) {
    if (!isRecord(value)) return false;
    if (!isIsoDateLike(value.timestamp)) return false;
    if (!isNonEmptyString(value.note)) return false;
    if (value.author !== undefined && !isNonEmptyString(value.author)) return false;
    return true;
  }

  function hasKnownAnomalyCode(code) {
    const api = global.TarsAnomalyCodes;
    if (api && typeof api.has === 'function') return api.has(code);
    return isNonEmptyString(code);
  }

  function isTarsCompositionV1Ref(value) {
    return isRecord(value) && value.$schema === TARS_COMPOSITION_SCHEMA_V1;
  }

  function isTarsBatchEventV1(value) {
    if (!isRecord(value)) return false;
    if (!isIsoDateLike(value.timestamp)) return false;
    if (value.elapsed_min !== undefined && !isFiniteNumber(value.elapsed_min)) return false;
    if (!BATCH_EVENT_KINDS.has(value.kind)) return false;
    if (value.state_snapshot !== undefined && !isBatchStateSnapshotV1(value.state_snapshot)) return false;
    switch (value.kind) {
      case 'temp_reading':
        return value.state_snapshot !== undefined;
      case 'addition':
        if (!isNonEmptyString(value.material) || !isPositiveNumber(value.qty_g)) return false;
        if (value.reason_code !== undefined && !isNonEmptyString(value.reason_code)) return false;
        if (value.note !== undefined && typeof value.note !== 'string') return false;
        return value.state_snapshot !== undefined;
      case 'anomaly':
        if (!hasKnownAnomalyCode(value.code)) return false;
        if (!BATCH_EVENT_SEVERITIES.has(value.severity)) return false;
        if (value.action_taken !== undefined && typeof value.action_taken !== 'string') return false;
        if (value.photo_ref !== undefined && !isNonEmptyString(value.photo_ref)) return false;
        if (value.note !== undefined && typeof value.note !== 'string') return false;
        return value.state_snapshot !== undefined;
      case 'scrap':
        if (!isBatchCountOrMassV1(value.count_or_mass)) return false;
        if (value.reason_code !== undefined && !hasKnownAnomalyCode(value.reason_code)) return false;
        if (value.note !== undefined && typeof value.note !== 'string') return false;
        return value.state_snapshot !== undefined;
      case 'note':
        return isNonEmptyString(value.note);
      default:
        return false;
    }
  }

  function getTarsBatchSessionV1Error(value) {
    if (!isRecord(value)) return 'Batch session must be an object.';
    if (value.$schema !== TARS_BATCH_SCHEMA_V1) return 'Unsupported batch schema.';
    if (value.version !== 1) return 'Unsupported batch-session version.';
    if (typeof value.batch_id !== 'string' || !value.batch_id.trim()) return 'batch_id is required.';
    if (!isIsoDateLike(value.created_at)) return 'created_at must be an ISO date string.';
    if (!BATCH_STATUSES.has(value.status)) return 'status is invalid.';
    if (value.started_at !== undefined && !isIsoDateLike(value.started_at)) return 'started_at must be an ISO date string.';
    if (value.ended_at !== undefined && !isIsoDateLike(value.ended_at)) return 'ended_at must be an ISO date string.';
    if ((value.status === 'finalized' || value.status === 'cancelled') && value.ended_at === undefined) {
      return 'finalized or cancelled sessions require ended_at.';
    }
    if (value.planned_composition !== undefined && !isTarsCompositionV1Ref(value.planned_composition)) return 'planned_composition must use tars-composition-v1.';
    if (value.recipe_id !== undefined && typeof value.recipe_id !== 'string' && typeof value.recipe_id !== 'number') return 'recipe_id must be a string or number.';
    if (value.events !== undefined && (!Array.isArray(value.events) || !value.events.every(isTarsBatchEventV1))) return 'events must be valid TarsBatchEventV1 entries.';
    if (value.audit_trail !== undefined && (!Array.isArray(value.audit_trail) || !value.audit_trail.every(isBatchAuditEntryV1))) {
      return 'audit_trail must be valid audit entries.';
    }
    if (value.notes !== undefined && (!Array.isArray(value.notes) || !value.notes.every(isBatchNoteEntryV1))) {
      return 'notes must be valid retrospective notes.';
    }
    return null;
  }

  function isTarsBatchSessionV1(value) {
    return getTarsBatchSessionV1Error(value) === null;
  }

  global.TarsBatchSchema = Object.freeze({
    TARS_BATCH_SCHEMA_V1,
    TARS_COMPOSITION_SCHEMA_V1,
    BATCH_STATUSES: Object.freeze(Array.from(BATCH_STATUSES)),
    BATCH_EVENT_KINDS: Object.freeze(Array.from(BATCH_EVENT_KINDS)),
    isTarsCompositionV1Ref,
    isTarsBatchEventV1,
    isTarsBatchSessionV1,
    getTarsBatchSessionV1Error,
  });
})(window);
