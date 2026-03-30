// Tab Switching Logic
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        const contentId = tab.getAttribute('data-tab');
        document.getElementById(contentId).classList.add('active');
        
        // Reset patient views when switching tabs
        if (contentId === 'patient-tab') {
            document.getElementById('patientForm').classList.remove('d-none');
            const regForm = document.getElementById('patientRegisterForm');
            if(regForm) regForm.classList.add('d-none');
        }
    });
});

// Register/Login toggle
document.getElementById('showRegisterBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('patientForm').classList.add('d-none');
    document.getElementById('patientRegisterForm').classList.remove('d-none');
});

document.getElementById('showLoginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('patientRegisterForm').classList.add('d-none');
    document.getElementById('patientForm').classList.remove('d-none');
});

// Doctor Register/Login toggle
document.getElementById('showDoctorRegisterBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('doctorLoginForm').classList.add('d-none');
    document.getElementById('doctorRegisterForm').classList.remove('d-none');
    populateDoctorDropdowns();
});

document.getElementById('showDoctorLoginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('doctorRegisterForm').classList.add('d-none');
    document.getElementById('doctorLoginForm').classList.remove('d-none');
});

function populateDoctorDropdowns() {
    const hospitalSelect = document.getElementById('docRegHospital');
    const departmentSelect = document.getElementById('docRegDepartment');
    
    if (hospitalSelect.options.length <= 1) {
        DEFAULT_HOSPITALS.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h;
            opt.textContent = h;
            hospitalSelect.appendChild(opt);
        });
    }
    
    if (departmentSelect.options.length <= 1) {
        DEFAULT_DEPARTMENTS.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            departmentSelect.appendChild(opt);
        });
    }
}

// Toast Notification Function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if(type === 'success') icon = 'check_circle';
    if(type === 'error') icon = 'error';
    if(type === 'warning') icon = 'warning';

    toast.innerHTML = `
        <span class="material-icons">${icon}</span>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if(toastContainer.contains(toast)) {
            toastContainer.removeChild(toast);
        }
    }, 3500);
}

// Patient Login
document.getElementById('patientForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const tc = document.getElementById('patientTc').value;
    const password = document.getElementById('patientPassword').value;
    const remember = document.getElementById('rememberPatient').checked;

    if (tc.length !== 11) {
        showToast("T.C. Kimlik numarası 11 haneli olmalıdır.", "warning");
        return;
    }

    const patients = getPatients();
    const patient = patients.find(p => p.tc === tc && p.password === password);

    if (patient) {
        if (remember) {
            localStorage.setItem('savedPatientTc', tc);
            localStorage.setItem('savedPatientPassword', password);
        } else {
            localStorage.removeItem('savedPatientTc');
            localStorage.removeItem('savedPatientPassword');
        }

        setCurrentUser(patient);
        showToast("Giriş başarılı, yönlendiriliyorsunuz...", "success");
        setTimeout(() => window.location.href = 'patient.html', 1000);
    } else {
        showToast("Hatalı T.C. Kimlik No veya Şifre. Kayıt olmadıysanız lütfen önce kayıt olun.", "error");
    }
});

// Patient Register
document.getElementById('patientRegisterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const tc = document.getElementById('regTc').value;
    const name = document.getElementById('regName').value;
    const password = document.getElementById('regPassword').value;

    if (tc.length !== 11) {
        showToast("T.C. Kimlik numarası 11 haneli olmalıdır.", "warning");
        return;
    }

    const patients = getPatients();
    if (patients.find(p => p.tc === tc)) {
        showToast("Bu T.C. Kimlik numarası ile zaten kayıt olunmuş.", "error");
        return;
    }

    const newPatient = {
        id: 'p_' + Date.now(),
        tc: tc,
        name: name,
        password: password,
        role: 'patient'
    };

    patients.push(newPatient);
    savePatients(patients);

    showToast("Kayıt başarılı! Lütfen giriş yapın.", "success");
    document.getElementById('patientRegisterForm').reset();
    document.getElementById('patientRegisterForm').classList.add('d-none');
    document.getElementById('patientForm').classList.remove('d-none');
    
    // Auto fill TC
    document.getElementById('patientTc').value = tc;
    document.getElementById('patientPassword').focus();
});

// Doctor Login
document.getElementById('doctorLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('doctorEmail').value;
    const password = document.getElementById('doctorPassword').value;
    const remember = document.getElementById('rememberDoctor').checked;
    
    const doctors = getDoctors();
    const doctor = doctors.find(d => d.email === email && d.password === password);
    
    if (doctor) {
        if (remember) {
            localStorage.setItem('savedDoctorEmail', email);
            localStorage.setItem('savedDoctorPassword', password);
        } else {
            localStorage.removeItem('savedDoctorEmail');
            localStorage.removeItem('savedDoctorPassword');
        }

        const doctorData = { ...doctor, role: 'doctor' };
        setCurrentUser(doctorData);
        showToast("Giriş başarılı, yönlendiriliyorsunuz...", "success");
        setTimeout(() => window.location.href = 'doctor.html', 1000);
    } else {
        showToast("Hatalı E-Posta veya Şifre.", "error");
    }
});

// Doctor Register
document.getElementById('doctorRegisterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('docRegName').value;
    const email = document.getElementById('docRegEmail').value;
    const hospital = document.getElementById('docRegHospital').value;
    const department = document.getElementById('docRegDepartment').value;
    const password = document.getElementById('docRegPassword').value;

    const doctors = getDoctors();
    if (doctors.find(d => d.email === email)) {
        showToast("Bu e-posta adresi ile zaten kayıt olunmuş.", "error");
        return;
    }

    const newDoctor = {
        id: 'd_' + Date.now(),
        name: 'Dr. ' + name,
        email: email,
        hospital: hospital,
        department: department,
        password: password,
        role: 'doctor'
    };

    doctors.push(newDoctor);
    saveDoctors(doctors);

    showToast("Kayıt başarılı! Lütfen giriş yapın.", "success");
    document.getElementById('doctorRegisterForm').reset();
    document.getElementById('doctorRegisterForm').classList.add('d-none');
    document.getElementById('doctorLoginForm').classList.remove('d-none');
    
    // Auto fill email
    document.getElementById('doctorEmail').value = email;
    document.getElementById('doctorPassword').focus();
});

// Check if already logged in or remember me
window.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user) {
        if(user.role === 'patient') window.location.href = 'patient.html';
        if(user.role === 'doctor') window.location.href = 'doctor.html';
    }

    // Fill Remember Me fields
    const savedPatientTc = localStorage.getItem('savedPatientTc');
    const savedPatientPassword = localStorage.getItem('savedPatientPassword');
    if (savedPatientTc && savedPatientPassword) {
        document.getElementById('patientTc').value = savedPatientTc;
        document.getElementById('patientPassword').value = savedPatientPassword;
        document.getElementById('rememberPatient').checked = true;
    }

    const savedDoctorEmail = localStorage.getItem('savedDoctorEmail');
    const savedDoctorPassword = localStorage.getItem('savedDoctorPassword');
    if (savedDoctorEmail && savedDoctorPassword) {
        document.getElementById('doctorEmail').value = savedDoctorEmail;
        document.getElementById('doctorPassword').value = savedDoctorPassword;
        document.getElementById('rememberDoctor').checked = true;
    }
});
