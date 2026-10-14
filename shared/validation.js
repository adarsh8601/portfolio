/**
 * Validation rules shared by the browser (instant feedback) and the server
 * (the authoritative check). Pure functions, no DOM / Node APIs.
 */

export const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  subject: { min: 3, max: 120 },
  message: { min: 20, max: 3000 },
  role: { min: 2, max: 100 },
  company: { max: 120 },
  purposeDetail: { min: 10, max: 600 },
  attachmentBytes: 5 * 1024 * 1024,
  // Bot check: a human needs at least this long to fill the form.
  minFillMs: 2500,
};

export const ATTACHMENT_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};
export const ATTACHMENT_ACCEPT = Object.keys(ATTACHMENT_TYPES).map((e) => `.${e}`).join(',');

export const RESUME_PURPOSES = [
  { value: 'recruitment', label: 'Recruitment / Job Opportunity' },
  { value: 'internship', label: 'Internship Opportunity' },
  { value: 'collaboration', label: 'Professional Collaboration' },
  { value: 'academic', label: 'Academic or Research Purpose' },
  { value: 'other', label: 'Other' },
];

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

const str = (v) => (typeof v === 'string' ? v.trim() : '');

function text(errors, key, value, { min = 0, max, label, field, required = true }) {
  if (!value) {
    if (required) errors[key] = `Please enter ${label}.`;
    return;
  }
  if (value.length < min) errors[key] = `${field} must be at least ${min} characters.`;
  else if (max && value.length > max) errors[key] = `${field} must be ${max} characters or fewer.`;
}

export function isEmail(v) {
  return typeof v === 'string' && v.length <= LIMITS.email.max && EMAIL_RE.test(v.trim());
}

function email(errors, key, value) {
  if (!value) errors[key] = 'Please enter your email address.';
  else if (!isEmail(value)) errors[key] = 'Please enter a valid email address (e.g. name@company.com).';
}

/** Validates name/size/extension of an attachment. Content sniffing happens server-side. */
export function validateAttachmentMeta(file) {
  if (!file || !file.size) return null;
  const ext = (file.name || '').split('.').pop().toLowerCase();
  if (!ATTACHMENT_TYPES[ext] || (file.name || '').split('.').length < 2) {
    return 'Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG.';
  }
  if (file.size > LIMITS.attachmentBytes) return 'File is too large (maximum 5 MB).';
  return null;
}

export function validateContact(input) {
  const v = {
    name: str(input.name),
    email: str(input.email),
    subject: str(input.subject),
    message: str(input.message),
  };
  const errors = {};
  text(errors, 'name', v.name, { ...LIMITS.name, label: 'your full name', field: 'Name' });
  email(errors, 'email', v.email);
  text(errors, 'subject', v.subject, { ...LIMITS.subject, label: 'a subject', field: 'Subject' });
  text(errors, 'message', v.message, { ...LIMITS.message, label: 'a message', field: 'Message' });
  const fileErr = validateAttachmentMeta(input.attachment);
  if (fileErr) errors.attachment = fileErr;
  return { values: v, errors, ok: Object.keys(errors).length === 0 };
}

export function validateResumeRequest(input) {
  const v = {
    name: str(input.name),
    email: str(input.email),
    role: str(input.role),
    company: str(input.company),
    purpose: str(input.purpose),
    purposeDetail: str(input.purposeDetail),
    consent: input.consent === true || input.consent === 'true' || input.consent === 'on',
  };
  const errors = {};
  text(errors, 'name', v.name, { ...LIMITS.name, label: 'your full name', field: 'Name' });
  email(errors, 'email', v.email);
  text(errors, 'role', v.role, { ...LIMITS.role, label: 'your current role', field: 'Role' });
  text(errors, 'company', v.company, { ...LIMITS.company, label: 'a company', field: 'Company', required: false });
  if (!RESUME_PURPOSES.some((p) => p.value === v.purpose)) errors.purpose = 'Please choose a purpose.';
  text(errors, 'purposeDetail', v.purposeDetail, {
    ...LIMITS.purposeDetail,
    label: 'a short explanation', field: 'Explanation',
    required: v.purpose === 'other',
  });
  if (!v.consent) errors.consent = 'Please confirm consent so the request can be processed.';
  return { values: v, errors, ok: Object.keys(errors).length === 0 };
}
