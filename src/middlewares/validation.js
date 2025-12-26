const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('errors/400', {
      title: 'Validation Error',
      layout: 'layouts/main',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for patient creation
 */
const validatePatient = [
  body('name')
    .trim()
    .notEmpty().withMessage('Patient name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  handleValidationErrors
];

/**
 * Validation rules for visit creation
 */
const validateVisit = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required'),
  body('symptoms')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Symptoms too long'),
  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Diagnosis too long'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Notes too long'),
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validatePatient,
  validateVisit,
  validateLogin
};

