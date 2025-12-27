/**
 * Prescription Form JavaScript
 * Handles medicine search, dosage calculator, signature capture, and template loading
 */

document.addEventListener('DOMContentLoaded', function () {
  let medicineCounter = 0;
  const medicinesList = document.getElementById('medicinesList');
  const medicinesInput = document.getElementById('medicinesInput');
  const medicineTemplate = document.getElementById('medicineTemplate');
  const addMedicineBtn = document.getElementById('addMedicineBtn');
  const templateSelect = document.getElementById('templateSelect');
  const loadTemplateBtn = document.getElementById('loadTemplateBtn');
  const signatureCanvas = document.getElementById('signatureCanvas');
  const clearSignatureBtn = document.getElementById('clearSignatureBtn');
  const doctorSignatureInput = document.getElementById('doctorSignatureInput');
  const prescriptionForm = document.getElementById('prescription-form');

  let isDrawing = false;
  let signatureData = null;

  // Initialize signature canvas
  if (signatureCanvas) {
    const ctx = signatureCanvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Mouse events
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile
    signatureCanvas.addEventListener('touchstart', handleTouch);
    signatureCanvas.addEventListener('touchmove', handleTouch);
    signatureCanvas.addEventListener('touchend', stopDrawing);
  }

  function startDrawing(e) {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.moveTo(x, y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = signatureCanvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handleTouch(e) {
    e.preventDefault();
    if (e.type === 'touchstart') {
      startDrawing(e);
    } else if (e.type === 'touchmove') {
      draw(e);
    }
  }

  function stopDrawing() {
    if (isDrawing) {
      isDrawing = false;
      signatureData = signatureCanvas.toDataURL();
      doctorSignatureInput.value = signatureData;
    }
  }

  if (clearSignatureBtn) {
    clearSignatureBtn.addEventListener('click', function () {
      ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
      signatureData = null;
      doctorSignatureInput.value = '';
    });
  }

  // Add medicine button
  if (addMedicineBtn) {
    addMedicineBtn.addEventListener('click', addMedicineItem);
  }

  // Load template
  if (loadTemplateBtn && templateSelect) {
    loadTemplateBtn.addEventListener('click', function () {
      const templateId = templateSelect.value;
      if (templateId) {
        loadTemplate(templateId);
      }
    });
  }

  function addMedicineItem(medicineData = null) {
    medicineCounter++;
    const medicineItem = medicineTemplate.content.cloneNode(true);
    const medicineDiv = medicineItem.querySelector('.medicine-item');
    medicineDiv.dataset.index = medicineCounter;
    medicineItem.querySelector(
      '.medicine-index',
    ).textContent = `#${medicineCounter}`;

    // Append to DOM first to get actual DOM element
    medicinesList.appendChild(medicineItem);

    // Now get the actual DOM element (not the fragment)
    const actualMedicineDiv = medicinesList.querySelector(
      `.medicine-item[data-index="${medicineCounter}"]`,
    );

    // Set up medicine search
    const searchInput = actualMedicineDiv.querySelector('.medicine-search');
    const resultsDiv = actualMedicineDiv.querySelector('.medicine-results');
    const detailsDiv = actualMedicineDiv.querySelector('.medicine-details');

    let searchTimeout;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      const query = this.value.trim();
      if (query.length < 2) {
        resultsDiv.classList.add('hidden');
        // Allow manual entry - show details if user types something
        if (query.length > 0) {
          detailsDiv.classList.remove('hidden');
          const nameInput = actualMedicineDiv.querySelector('.medicine-name');
          if (nameInput) nameInput.value = query;
          updateMedicinesArray();
        }
        return;
      }

      searchTimeout = setTimeout(() => {
        searchMedicines(query, resultsDiv, detailsDiv, actualMedicineDiv);
      }, 300);
    });

    // Allow Enter key to manually add medicine if not in database
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = this.value.trim();
        if (query.length > 0 && resultsDiv.classList.contains('hidden')) {
          // Manual entry - show details
          detailsDiv.classList.remove('hidden');
          const nameInput = actualMedicineDiv.querySelector('.medicine-name');
          if (nameInput) nameInput.value = query;
          updateMedicinesArray();
        }
      }
    });

    // Remove medicine button
    actualMedicineDiv
      .querySelector('.remove-medicine-btn')
      .addEventListener('click', function () {
        actualMedicineDiv.remove();
        updateMedicinesArray();
      });

    // Dosage calculator
    const toggleCalculator =
      actualMedicineDiv.querySelector('.toggle-calculator');
    const calculatorPanel =
      actualMedicineDiv.querySelector('.calculator-panel');
    const calculateBtn = actualMedicineDiv.querySelector(
      '.calculate-dosage-btn',
    );
    const calculatedDosage =
      actualMedicineDiv.querySelector('.calculated-dosage');

    if (toggleCalculator) {
      toggleCalculator.addEventListener('click', function () {
        calculatorPanel.classList.toggle('hidden');
        toggleCalculator.textContent = calculatorPanel.classList.contains(
          'hidden',
        )
          ? 'Show Calculator'
          : 'Hide Calculator';
      });
    }

    if (calculateBtn) {
      calculateBtn.addEventListener('click', function () {
        const weight = parseFloat(
          actualMedicineDiv.querySelector('.patient-weight').value,
        );
        const age = parseFloat(
          actualMedicineDiv.querySelector('.patient-age').value,
        );
        const dosagePerKg = parseFloat(
          actualMedicineDiv.querySelector('.dosage-per-kg').value,
        );

        if (weight && dosagePerKg) {
          const totalDosage = weight * dosagePerKg;
          calculatedDosage.textContent = `Calculated Dosage: ${totalDosage.toFixed(
            2,
          )} mg`;
          calculatedDosage.classList.remove('hidden');

          // Auto-fill dosage field
          const dosageInput =
            actualMedicineDiv.querySelector('.medicine-dosage');
          if (dosageInput && !dosageInput.value) {
            dosageInput.value = `${totalDosage.toFixed(0)}mg`;
          }
        } else if (age && dosagePerKg) {
          // Use pediatric calculation (simplified)
          const adultDosage = dosagePerKg * 70; // Assume 70kg adult
          const pediatricDosage = (age / (age + 12)) * adultDosage;
          calculatedDosage.textContent = `Calculated Pediatric Dosage: ${pediatricDosage.toFixed(
            2,
          )} mg`;
          calculatedDosage.classList.remove('hidden');

          const dosageInput =
            actualMedicineDiv.querySelector('.medicine-dosage');
          if (dosageInput && !dosageInput.value) {
            dosageInput.value = `${pediatricDosage.toFixed(0)}mg`;
          }
        } else {
          alert('Please enter weight/age and dosage per kg');
        }
      });
    }

    // If medicine data provided (from template or existing prescription), populate fields
    if (medicineData) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        populateMedicineFields(actualMedicineDiv, medicineData);
      }, 50);
    }
  }

  function searchMedicines(query, resultsDiv, detailsDiv, medicineItem) {
    fetch(`/prescriptions/medicines/search?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        resultsDiv.innerHTML = '';
        if (data.medicines && data.medicines.length > 0) {
          resultsDiv.classList.remove('hidden');
          data.medicines.forEach(medicine => {
            const resultItem = document.createElement('div');
            resultItem.className =
              'px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200';
            resultItem.innerHTML = `
                            <div class="font-medium">${medicine.name}</div>
                            ${
                              medicine.genericName
                                ? `<div class="text-sm text-gray-600">${medicine.genericName}</div>`
                                : ''
                            }
                            ${
                              medicine.strength
                                ? `<div class="text-xs text-gray-500">${medicine.strength}</div>`
                                : ''
                            }
                        `;
            resultItem.addEventListener('click', function () {
              selectMedicine(medicine, detailsDiv, medicineItem);
              resultsDiv.classList.add('hidden');
            });
            resultsDiv.appendChild(resultItem);
          });
        } else {
          resultsDiv.classList.add('hidden');
        }
      })
      .catch(error => {
        console.error('Medicine search error:', error);
        resultsDiv.classList.add('hidden');
      });
  }

  function selectMedicine(medicine, detailsDiv, medicineDiv) {
    detailsDiv.classList.remove('hidden');

    const medicineIdInput = medicineDiv.querySelector('.medicine-id');
    const medicineNameInput = medicineDiv.querySelector('.medicine-name');
    const medicineStrengthInput =
      medicineDiv.querySelector('.medicine-strength');
    const dosageInput = medicineDiv.querySelector('.medicine-dosage');
    const frequencySelect = medicineDiv.querySelector('.medicine-frequency');
    const durationInput = medicineDiv.querySelector('.medicine-duration');
    const instructionsTextarea = medicineDiv.querySelector(
      '.medicine-instructions',
    );
    const searchInput = medicineDiv.querySelector('.medicine-search');

    if (medicineIdInput) medicineIdInput.value = medicine.id || '';
    if (medicineNameInput) medicineNameInput.value = medicine.name || '';
    if (medicineStrengthInput)
      medicineStrengthInput.value = medicine.strength || '';
    if (searchInput) searchInput.value = medicine.name || '';

    if (medicine.strength && dosageInput && !dosageInput.value) {
      dosageInput.value = medicine.strength;
    }

    if (medicine.frequency && frequencySelect) {
      frequencySelect.value = medicine.frequency;
    }
    if (medicine.duration && durationInput) {
      durationInput.value = medicine.duration;
    }
    if (medicine.instructions && instructionsTextarea) {
      instructionsTextarea.value = medicine.instructions;
    }

    // Also check for default values from medicine database
    if (medicine.defaultDosage && dosageInput && !dosageInput.value) {
      dosageInput.value = medicine.defaultDosage;
    }
    if (
      medicine.defaultFrequency &&
      frequencySelect &&
      !frequencySelect.value
    ) {
      frequencySelect.value = medicine.defaultFrequency;
    }
    if (medicine.defaultDuration && durationInput && !durationInput.value) {
      durationInput.value = medicine.defaultDuration;
    }

    updateMedicinesArray();
  }

  function populateMedicineFields(medicineItem, medicineData) {
    const nameInput = medicineItem.querySelector('.medicine-name');
    const dosageInput = medicineItem.querySelector('.medicine-dosage');
    const frequencySelect = medicineItem.querySelector('.medicine-frequency');
    const durationInput = medicineItem.querySelector('.medicine-duration');
    const quantityInput = medicineItem.querySelector('.medicine-quantity');
    const instructionsTextarea = medicineItem.querySelector(
      '.medicine-instructions',
    );
    const detailsDiv = medicineItem.querySelector('.medicine-details');
    const searchInput = medicineItem.querySelector('.medicine-search');

    if (nameInput) nameInput.value = medicineData.name || '';
    if (dosageInput) dosageInput.value = medicineData.dosage || '';
    if (frequencySelect) frequencySelect.value = medicineData.frequency || '';
    if (durationInput) durationInput.value = medicineData.duration || '';
    if (quantityInput) quantityInput.value = medicineData.quantity || '';
    if (instructionsTextarea)
      instructionsTextarea.value = medicineData.instructions || '';
    if (searchInput) searchInput.value = medicineData.name || '';

    if (detailsDiv && medicineData.name) {
      detailsDiv.classList.remove('hidden');
    }
  }

  function loadTemplate(templateId) {
    fetch(`/prescriptions/templates/${templateId}`)
      .then(response => response.json())
      .then(data => {
        if (data.template && data.template.medicines) {
          // Clear existing medicines
          medicinesList.innerHTML = '';
          medicineCounter = 0;

          // Add medicines from template
          data.template.medicines.forEach(medicine => {
            addMedicineItem(medicine);
          });

          // Set advice if available
          if (data.template.advice && document.getElementById('advice')) {
            document.getElementById('advice').value = data.template.advice;
          }

          // Set template ID
          const templateIdInput = document.createElement('input');
          templateIdInput.type = 'hidden';
          templateIdInput.name = 'templateId';
          templateIdInput.value = templateId;
          prescriptionForm.appendChild(templateIdInput);
        }
      })
      .catch(error => {
        console.error('Load template error:', error);
        alert('Failed to load template');
      });
  }

  function updateMedicinesArray() {
    const medicines = [];
    medicinesList.querySelectorAll('.medicine-item').forEach(item => {
      const details = item.querySelector('.medicine-details');
      if (!details || details.classList.contains('hidden')) return;

      const medicine = {
        id: item.querySelector('.medicine-id')?.value || null,
        name: item.querySelector('.medicine-name')?.value || '',
        strength: item.querySelector('.medicine-strength')?.value || '',
        dosage: item.querySelector('.medicine-dosage')?.value || '',
        frequency: item.querySelector('.medicine-frequency')?.value || '',
        duration: item.querySelector('.medicine-duration')?.value || '',
        quantity: item.querySelector('.medicine-quantity')?.value || '',
        instructions: item.querySelector('.medicine-instructions')?.value || '',
      };

      if (medicine.name) {
        medicines.push(medicine);
      }
    });

    medicinesInput.value = JSON.stringify(medicines);
  }

  // Update medicines array on any change
  medicinesList.addEventListener('input', updateMedicinesArray);
  medicinesList.addEventListener('change', updateMedicinesArray);

  // Form submission
  if (prescriptionForm) {
    prescriptionForm.addEventListener('submit', function (e) {
      updateMedicinesArray();
      const medicines = JSON.parse(medicinesInput.value);
      if (medicines.length === 0) {
        e.preventDefault();
        alert('Please add at least one medicine');
        return false;
      }
    });
  }

  // Add first medicine item on load (only if no existing medicines)
  const existingMedicinesData =
    document.getElementById('medicinesInput')?.value;
  if (existingMedicinesData) {
    try {
      const medicines = JSON.parse(existingMedicinesData);
      if (medicines && medicines.length > 0) {
        medicines.forEach(medicine => {
          addMedicineItem(medicine);
        });
      } else {
        addMedicineItem();
      }
    } catch (e) {
      addMedicineItem();
    }
  } else {
    addMedicineItem();
  }

  // Expose function for external use
  window.addMedicineFromData = function (medicineData) {
    addMedicineItem(medicineData);
  };
  window.prescriptionFormLoaded = true;
});
