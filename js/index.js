// ===== WAIT FOR DOM TO LOAD =====
document.addEventListener('DOMContentLoaded', () => {

    // ===== GET FORM ELEMENTS =====
    const form = document.getElementById('registrationForm');
    const fullName = document.getElementById('fullName');
    const studentId = document.getElementById('studentId');
    const email = document.getElementById('email');
    const programme = document.getElementById('programme');

    // ===== FORM SUBMISSION HANDLER =====
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop default form submission

        // Get trimmed values
        const studentData = {
            fullName: fullName.value.trim(),
            studentId: studentId.value.trim(),
            email: email.value.trim(),
            programme: programme.value,
            registeredAt: new Date().toISOString()
        };

        // ===== VALIDATION =====
        if (!validateForm(studentData)) {
            return; // Stop if validation fails
        }

        // ===== SAVE TO LOCALSTORAGE =====
        localStorage.setItem('studentData', JSON.stringify(studentData));

        // ===== SUCCESS MESSAGE =====
        showMessage('Registration successful! Redirecting to exam...', 'success');

        // ===== REDIRECT AFTER 1.5 SECONDS =====
        setTimeout(() => {
            window.location.href = 'exam.html';
        }, 1500);
    });

    // ===== VALIDATION FUNCTION =====
    function validateForm(data) {
        // Check empty fields
        if (!data.fullName || !data.studentId || !data.email || !data.programme) {
            showMessage('Please fill in all fields!', 'error');
            return false;
        }

        // Full name validation (at least 2 words)
        if (data.fullName.split(' ').length < 2) {
            showMessage('Please enter your full name (first and last name).', 'error');
            fullName.focus();
            return false;
        }

        // Student ID validation (alphanumeric, at least 4 chars)
        const idPattern = /^[a-zA-Z0-9]{4,}$/;
        if (!idPattern.test(data.studentId)) {
            showMessage('Student ID must be at least 4 alphanumeric characters.', 'error');
            studentId.focus();
            return false;
        }

        // Email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(data.email)) {
            showMessage('Please enter a valid email address.', 'error');
            email.focus();
            return false;
        }

        return true;
    }

    // ===== SHOW MESSAGE FUNCTION =====
    function showMessage(message, type) {
        // Remove existing message if any
        const existingMsg = document.querySelector('.alert-message');
        if (existingMsg) existingMsg.remove();

        // Create message element
        const msgDiv = document.createElement('div');
        msgDiv.className = `alert-message alert-${type}`;
        msgDiv.textContent = message;

        // Insert at top of form
        form.insertBefore(msgDiv, form.firstChild);

        // Auto-remove after 4 seconds (for errors)
        if (type === 'error') {
            setTimeout(() => msgDiv.remove(), 4000);
        }
    }

    // ===== REAL-TIME INPUT FEEDBACK =====
    const inputs = [fullName, studentId, email];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.style.borderColor = '#6c3fd1';
            } else {
                input.style.borderColor = '#e0e0e0';
            }
        });
    });

    // ===== LOAD SAVED DATA (if user comes back) =====
    const savedData = localStorage.getItem('studentData');
    if (savedData) {
        const data = JSON.parse(savedData);
        // Optional: pre-fill form
        // fullName.value = data.fullName || '';
        // studentId.value = data.studentId || '';
        // email.value = data.email || '';
        // programme.value = data.programme || '';
        console.log('Previous student data found:', data);
    }

});