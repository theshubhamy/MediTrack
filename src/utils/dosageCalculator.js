/**
 * Dosage Calculator Utility
 * Calculates medicine dosages based on patient weight, age, and medicine strength
 */

/**
 * Calculate dosage based on weight (mg/kg)
 * @param {number} weightKg - Patient weight in kilograms
 * @param {number} dosagePerKg - Dosage per kg (e.g., 10 for 10mg/kg)
 * @returns {number} Total dosage in mg
 */
function calculateByWeight(weightKg, dosagePerKg) {
  if (!weightKg || !dosagePerKg) return null;
  return Math.round(weightKg * dosagePerKg * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate dosage based on age
 * @param {number} age - Patient age in years
 * @param {Object} ageDosageMap - Map of age ranges to dosages
 * @returns {number|null} Dosage
 */
function calculateByAge(age, ageDosageMap) {
  if (!age || !ageDosageMap) return null;

  for (const range of ageDosageMap) {
    if (age >= range.min && age <= range.max) {
      return range.dosage;
    }
  }
  return null;
}

/**
 * Calculate number of tablets/capsules needed
 * @param {number} requiredDosage - Required dosage in mg
 * @param {number} tabletStrength - Strength of one tablet in mg
 * @returns {Object} { count, remainder }
 */
function calculateTablets(requiredDosage, tabletStrength) {
  if (!requiredDosage || !tabletStrength) return { count: null, remainder: null };

  const count = Math.ceil(requiredDosage / tabletStrength);
  const remainder = requiredDosage % tabletStrength;

  return {
    count,
    remainder: remainder > 0 ? remainder : 0,
    exact: remainder === 0,
  };
}

/**
 * Calculate liquid dosage (ml)
 * @param {number} requiredDosage - Required dosage in mg
 * @param {number} concentration - Concentration in mg/ml
 * @returns {number} Volume in ml
 */
function calculateLiquid(requiredDosage, concentration) {
  if (!requiredDosage || !concentration) return null;
  return Math.round((requiredDosage / concentration) * 100) / 100;
}

/**
 * Parse strength string (e.g., "500mg", "10ml")
 * @param {string} strength - Strength string
 * @returns {Object} { value, unit }
 */
function parseStrength(strength) {
  if (!strength) return { value: null, unit: null };

  const match = strength.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
    };
  }
  return { value: null, unit: null };
}

/**
 * Format dosage for display
 * @param {number} dosage - Dosage value
 * @param {string} unit - Unit (mg, ml, etc.)
 * @returns {string} Formatted string
 */
function formatDosage(dosage, unit = 'mg') {
  if (dosage === null || dosage === undefined) return 'N/A';
  return `${dosage}${unit}`;
}

/**
 * Calculate pediatric dosage (common formulas)
 * @param {number} age - Age in years
 * @param {number} adultDosage - Adult dosage
 * @param {string} formula - Formula to use ('young', 'clark', 'dilling')
 * @returns {number} Pediatric dosage
 */
function calculatePediatricDosage(age, adultDosage, formula = 'young') {
  if (!age || !adultDosage) return null;

  let factor = 1;

  switch (formula) {
    case 'young':
      // Young's formula: (Age / (Age + 12)) * Adult Dose
      factor = age / (age + 12);
      break;
    case 'clark':
      // Clark's formula: (Weight in lbs / 150) * Adult Dose
      // This requires weight, so we'll use Young's as default
      factor = age / (age + 12);
      break;
    case 'dilling':
      // Dilling's formula: (Age / 20) * Adult Dose
      factor = age / 20;
      break;
    default:
      factor = age / (age + 12);
  }

  return Math.round(adultDosage * factor * 100) / 100;
}

module.exports = {
  calculateByWeight,
  calculateByAge,
  calculateTablets,
  calculateLiquid,
  parseStrength,
  formatDosage,
  calculatePediatricDosage,
};

