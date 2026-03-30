// Toast Function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'info';
    if(type === 'success') icon = 'check_circle';
    if(type === 'error') icon = 'error';
    if(type === 'warning') icon = 'warning';

    toast.innerHTML = `<span class="material-icons">${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        if(toastContainer.contains(toast)) toastContainer.removeChild(toast);
    }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
    // Check Authorization
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'doctor') {
        window.location.href = 'index.html';
        return;
    }

    // Set Welcome Display
    document.getElementById('doctorNameDisplay').textContent = currentUser.name;
    document.getElementById('doctorDetailsDisplay').textContent = `${currentUser.hospital || 'Hastane Belirtilmemiş'} - ${currentUser.department || 'Bölüm Belirtilmemiş'}`;

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
    });

    // Min date limits
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('rescheduleDate').setAttribute('min', today);

    // Initial load
    loadDoctorAppointments();
});

// Load lists
function loadDoctorAppointments() {
    const currentUser = getCurrentUser();
    const allApps = getAppointments();
    
    // Filter by this doctor
    const myApps = allApps.filter(a => a.doctorId === currentUser.id);
    
    // Split into pending and accepted
    const pendingApps = myApps.filter(a => a.status === 'pending');
    // We only show accepted ones here (rejected ones are hidden from doctor generally)
    const acceptedApps = myApps.filter(a => a.status === 'accepted');

    // Sort: earliest date first for pending, same for accepted
    pendingApps.sort((a,b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    acceptedApps.sort((a,b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    renderPendingList(pendingApps);
    renderAcceptedList(acceptedApps);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// 1. Pending List Renderer
function renderPendingList(apps) {
    const list = document.getElementById('pendingList');
    list.innerHTML = '';

    if (apps.length === 0) {
        list.innerHTML = `<p class="text-muted text-center py-4">Bekleyen randevu talebiniz bulunmamaktadır.</p>`;
        return;
    }

    apps.forEach(app => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 1.25rem; border: 1px solid var(--border-color); border-radius: 12px;
            display: flex; justify-content: space-between; align-items: center; gap: 1rem;
            background: #fff;
        `;

        item.innerHTML = `
            <div>
                <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.25rem;">
                    Hasta: ${app.patientName}
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.95rem;">
                    <span class="material-icons" style="font-size: 1.1rem;">event</span>
                    ${formatDate(app.date)} - ${app.time}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-success" onclick="updateAppStatus('${app.id}', 'accepted')">
                    <span class="material-icons" style="font-size: 1.2rem;">check</span> Kabul Et
                </button>
                <button class="btn btn-danger" onclick="updateAppStatus('${app.id}', 'rejected')">
                    <span class="material-icons" style="font-size: 1.2rem;">close</span> Reddet
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

// 2. Accepted List Renderer
function renderAcceptedList(apps) {
    const list = document.getElementById('acceptedList');
    list.innerHTML = '';

    if (apps.length === 0) {
        list.innerHTML = `<p class="text-muted text-center py-4">Onaylanmış aktif randevunuz bulunmamaktadır.</p>`;
        return;
    }

    apps.forEach(app => {
        const isPast = new Date(`${app.date}T${app.time}`) < new Date();
        const opacity = isPast ? '0.6' : '1';
        const pastTag = isPast ? '<span class="badge badge-warning" style="margin-left: 10px;">Geçmiş Test Tarihi</span>' : '';

        const item = document.createElement('div');
        item.style.cssText = `
            padding: 1.25rem; border: 1px solid var(--border-color); border-radius: 12px;
            display: flex; justify-content: space-between; align-items: center; gap: 1rem;
            background: #fff; opacity: ${opacity};
        `;

        item.innerHTML = `
            <div>
                <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.25rem;">
                    Hasta: ${app.patientName} ${pastTag}
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.95rem;">
                    <span class="material-icons" style="font-size: 1.1rem; color: var(--success);">event_available</span>
                    ${formatDate(app.date)} - ${app.time}
                </div>
            </div>
            ${!isPast ? `
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-outline" style="border-color: var(--primary); color: var(--primary);" 
                        onclick="openRescheduleModal('${app.id}')">
                    <span class="material-icons" style="font-size: 1.2rem;">edit_calendar</span> Aktar
                </button>
                <button class="btn btn-outline" style="border-color: var(--danger); color: var(--danger);" 
                        onclick="cancelAcceptedApp('${app.id}')">
                    <span class="material-icons" style="font-size: 1.2rem;">cancel</span> İptal
                </button>
            </div>
            ` : ''}
        `;
        list.appendChild(item);
    });
}

// Actions
function updateAppStatus(appId, newStatus) {
    const apps = getAppointments();
    const index = apps.findIndex(a => a.id === appId);
    if (index > -1) {
        apps[index].status = newStatus;
        saveAppointments(apps);
        showToast(`Randevu ${newStatus === 'accepted' ? 'onaylandı' : 'reddedildi'}.`, newStatus === 'accepted' ? 'success' : 'warning');
        loadDoctorAppointments();
    }
}

// Cancel already accepted one
function cancelAcceptedApp(appId) {
    if(confirm("Bu randevuyu iptal etmek (reddetmek) istediğinize emin misiniz? Hasta sistemden iptal edildiğini görecektir.")) {
        updateAppStatus(appId, 'rejected');
    }
}

// Reschedule Modal Logic
let currentRescheduleId = null;
const modal = document.getElementById('rescheduleModal');
const closeBtn = document.getElementById('closeModalBtn');
const reschedForm = document.getElementById('rescheduleForm');

function openRescheduleModal(appId) {
    currentRescheduleId = appId;
    
    // Find current app info
    const apps = getAppointments();
    const app = apps.find(a => a.id === appId);
    if(app) {
        document.getElementById('rescheduleDate').value = app.date;
        document.getElementById('rescheduleTime').value = app.time;
    }
    
    modal.classList.add('active');
}

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    currentRescheduleId = null;
});

reschedForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!currentRescheduleId) return;

    const newDate = document.getElementById('rescheduleDate').value;
    const newTime = document.getElementById('rescheduleTime').value;

    const apps = getAppointments();
    const index = apps.findIndex(a => a.id === currentRescheduleId);
    
    if (index > -1) {
        apps[index].date = newDate;
        apps[index].time = newTime;
        saveAppointments(apps);
        showToast('Randevu başarıyla yeni tarihe aktarıldı.', 'success');
        
        modal.classList.remove('active');
        currentRescheduleId = null;
        loadDoctorAppointments();
    }
});
