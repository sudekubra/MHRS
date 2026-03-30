// Toast Function (Global helper)
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
    if (!currentUser || currentUser.role !== 'patient') {
        window.location.href = 'index.html';
        return;
    }

    // Set Welcome Display
    document.getElementById('patientNameDisplay').textContent = currentUser.name;

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
    });

    initForm();
    loadMyAppointments();
});

// Form Elements
const hospitalSelect = document.getElementById('hospitalSelect');
const departmentSelect = document.getElementById('departmentSelect');
const doctorSelect = document.getElementById('doctorSelect');
const dateSelect = document.getElementById('dateSelect');
const timeSelect = document.getElementById('timeSelect');
const submitBtn = document.getElementById('submitBtn');

function initForm() {
    // Populate Hospitals
    DEFAULT_HOSPITALS.forEach(hosp => {
        const option = document.createElement('option');
        option.value = hosp;
        option.textContent = hosp;
        hospitalSelect.appendChild(option);
    });

    // Set Min Date constraint (Today) and Max Date constraint (7 days from today)
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    
    const maxDateObj = new Date(today);
    maxDateObj.setDate(today.getDate() + 7);
    const maxDate = maxDateObj.toISOString().split('T')[0];

    dateSelect.setAttribute('min', minDate);
    dateSelect.setAttribute('max', maxDate);

    // Event Listeners for cascading dropdowns
    hospitalSelect.addEventListener('change', () => {
        if (hospitalSelect.value) {
            departmentSelect.disabled = false;
            departmentSelect.innerHTML = '<option value="">Bölüm Seçiniz</option>';
            DEFAULT_DEPARTMENTS.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                departmentSelect.appendChild(option);
            });
        } else {
            resetDropdowns(['department', 'doctor', 'date', 'time']);
        }
    });

    departmentSelect.addEventListener('change', () => {
        if (departmentSelect.value) {
            doctorSelect.disabled = false;
            doctorSelect.innerHTML = '<option value="">Doktor Seçiniz</option>';
            const allDocs = getDoctors();
            const doctorsInDept = allDocs.filter(d => d.department === departmentSelect.value && d.hospital === hospitalSelect.value);
            
            if (doctorsInDept.length === 0) {
                doctorSelect.innerHTML = '<option value="">Uygun Doktor Bulunamadı</option>';
            } else {
                doctorsInDept.forEach(doc => {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = doc.name;
                    doctorSelect.appendChild(option);
                });
            }
        } else {
            resetDropdowns(['doctor', 'date', 'time']);
        }
    });

    doctorSelect.addEventListener('change', () => {
        if (doctorSelect.value) {
            dateSelect.disabled = false;
        } else {
            resetDropdowns(['date', 'time']);
        }
    });

    dateSelect.addEventListener('change', () => {
        if (dateSelect.value) {
            timeSelect.disabled = false;
            timeSelect.innerHTML = '<option value="">Saat Seçiniz</option>';
            
            // Check appointments for selected doctor and date
            const selectedDate = dateSelect.value;
            const selectedDoctor = doctorSelect.value;
            const allApps = getAppointments();
            const bookedTimes = allApps
                .filter(a => a.doctorId === selectedDoctor && a.date === selectedDate && (a.status === 'pending' || a.status === 'accepted'))
                .map(a => a.time);

            // Generate time slots
            const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
            times.forEach(t => {
                const option = document.createElement('option');
                option.value = t;
                
                if (bookedTimes.includes(t)) {
                    option.textContent = `${t} (Dolu)`;
                    option.disabled = true;
                } else {
                    option.textContent = t;
                }
                
                timeSelect.appendChild(option);
            });
        } else {
            resetDropdowns(['time']);
        }
    });

    timeSelect.addEventListener('change', () => {
        submitBtn.disabled = !timeSelect.value;
    });

    // Form Submit
    document.getElementById('appointmentForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const doctorId = doctorSelect.value;
        const allDocs = getDoctors();
        const doctorObj = allDocs.find(d => d.id === doctorId);

        const newAppointment = {
            id: 'app_' + Date.now(),
            patientId: getCurrentUser().id,
            patientName: getCurrentUser().name,
            hospital: hospitalSelect.value,
            department: departmentSelect.value,
            doctorId: doctorId,
            doctorName: doctorObj ? doctorObj.name : 'Bilinmeyen Doktor',
            date: dateSelect.value,
            time: timeSelect.value,
            status: 'pending', // pending, accepted, rejected
            createdAt: new Date().toISOString()
        };

        const apps = getAppointments();
        // Check double booking for patient at exactly the same time? Not strictly necessary for mock, but good to add later.
        apps.push(newAppointment);
        saveAppointments(apps);

        showToast('Randevu talebiniz başarıyla oluşturuldu ve onay için doktora iletildi.', 'success');
        
        // Reset Form
        document.getElementById('appointmentForm').reset();
        resetDropdowns(['department', 'doctor', 'date', 'time']);
        submitBtn.disabled = true;

        // Reload List
        loadMyAppointments();
    });
}

function resetDropdowns(types) {
    if(types.includes('department')) {
        departmentSelect.innerHTML = '<option value="">Önce Hastane Seçiniz</option>';
        departmentSelect.disabled = true;
    }
    if(types.includes('doctor')) {
        doctorSelect.innerHTML = '<option value="">Önce Bölüm Seçiniz</option>';
        doctorSelect.disabled = true;
    }
    if(types.includes('date')) {
        dateSelect.value = '';
        dateSelect.disabled = true;
    }
    if(types.includes('time')) {
        timeSelect.innerHTML = '<option value="">Tarih Seçiniz</option>';
        timeSelect.disabled = true;
        submitBtn.disabled = true;
    }
}

function loadMyAppointments() {
    const listContainer = document.getElementById('appointmentsList');
    listContainer.innerHTML = '';

    const apps = getAppointments();
    const currentUser = getCurrentUser();

    // Filtrele sadece bu hastanın randevuları
    const myApps = apps.filter(a => a.patientId === currentUser.id);

    // Sort by Create At descending roughly
    myApps.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (myApps.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
                <span class="material-icons" style="font-size: 3rem; opacity: 0.5;">event_busy</span>
                <p style="margin-top: 1rem;">Henüz randevunuz bulunmamaktadır.</p>
            </div>
        `;
        return;
    }

    myApps.forEach(app => {
        const card = document.createElement('div');
        // Status Badge ve Color
        let badgeClass = 'badge-warning';
        let statusText = 'Onay Bekliyor';
        
        if (app.status === 'accepted') { badgeClass = 'badge-success'; statusText = 'Onaylandı'; }
        else if (app.status === 'rejected') { badgeClass = 'badge-danger'; statusText = 'Reddedildi'; }

        // Türkçe formatta tarih
        const dateObj = new Date(app.date);
        const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

        card.innerHTML = `
            <div style="padding: 1.25rem; border: 1px solid var(--border-color); border-radius: 12px; transition: var(--transition);">
                <div class="flex-between mb-2">
                    <div style="font-weight: 600; font-size: 1.1rem;">${app.doctorName}</div>
                    <span class="badge ${badgeClass}">${statusText}</span>
                </div>
                <div style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.5rem;">
                    ${app.hospital} - ${app.department}
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 500;">
                    <span class="material-icons" style="font-size: 1.1rem; color: var(--primary);">event</span>
                    ${formattedDate} - ${app.time}
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// ================= Chatbot Logic =================
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotContainer = document.getElementById('chatbotContainer');
const closeChatbot = document.getElementById('closeChatbot');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');

chatbotToggle?.addEventListener('click', () => {
    chatbotContainer.classList.add('active');
    chatbotToggle.style.display = 'none';
});

closeChatbot?.addEventListener('click', () => {
    chatbotContainer.classList.remove('active');
    setTimeout(() => chatbotToggle.style.display = 'flex', 300);
});

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChat?.addEventListener('click', handleChatInput);
chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatInput();
});

function handleChatInput() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';

    // Basit Gecikme ile Yanıt
    setTimeout(() => {
        processChatbotQuery(text);
    }, 600);
}

function processChatbotQuery(query) {
    const q = query.toLowerCase();
    
    // Basit NLP - Hastane ve Bölüm Aranıyor
    let foundHospital = null;
    let foundDept = null;

    DEFAULT_HOSPITALS.forEach(h => {
        if (q.includes(h.toLowerCase()) || q.includes(h.split(' ')[0].toLowerCase())) {
            foundHospital = h;
        }
    });

    DEFAULT_DEPARTMENTS.forEach(d => {
        if (q.includes(d.toLowerCase())) {
            foundDept = d;
        }
    });

    // Randevu Bul Cümlesi
    if (q.includes('randevu bul') || q.includes('randevu') || q.includes('boş')) {
        if (foundHospital && foundDept) {
            suggestAppointment(foundHospital, foundDept);
        } else if (foundHospital) {
            appendMessage(`<b>${foundHospital}</b> için hangi bölümden randevu arıyorsunuz?`, 'assistant');
        } else if (foundDept) {
            appendMessage(`<b>${foundDept}</b> bölümü için hangi hastaneden randevu arıyorsunuz?`, 'assistant');
        } else {
            appendMessage("Lütfen randevu aradığınız hastane ve bölümü tam olarak belirtin.<br><br>Örnek: <i>'Ankara Şehir Hastanesi Dahiliye randevu bul'</i>", 'assistant');
        }
    } else {
        appendMessage("Size randevu bulmam için hastane ve bölüm belirterek 'randevu bul' diyebilirsiniz.", 'assistant');
    }
}

function suggestAppointment(hospital, dept) {
    const allDocs = getDoctors();
    const availableDocs = allDocs.filter(d => d.hospital === hospital && d.department === dept);

    if (availableDocs.length === 0) {
        appendMessage(`Üzgünüm, <b>${hospital} - ${dept}</b> bölümünde kayıtlı doktor bulunamadı.`, 'assistant');
        return;
    }

    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
    const apps = getAppointments();

    let bestSlot = null;
    let bestDoc = null;
    let bestDateStr = null;
    let displayDate = null;

    // Önümüzdeki 7 günü tara
    for (let i = 1; i <= 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() + i);
        const dateStr = checkDate.toISOString().split('T')[0];

        for (const time of timeSlots) {
            for (const doc of availableDocs) {
                // Bu doktorun bu saatte aktif bir randevusu var mı? (pending veya accepted)
                const isBooked = apps.some(a => a.doctorId === doc.id && a.date === dateStr && a.time === time && (a.status === 'pending' || a.status === 'accepted'));
                if (!isBooked) {
                    bestSlot = time;
                    bestDoc = doc;
                    bestDateStr = dateStr;
                    displayDate = checkDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                    break;
                }
            }
            if (bestSlot) break;
        }
        if (bestSlot) break;
    }

    if (bestSlot && bestDoc && bestDateStr) {
        appendMessage(`Sizin için en yakın ve en uygun randevuyu buldum:<br><br>
            🏥 <b>Hastane:</b> ${hospital}<br>
            🩺 <b>Bölüm:</b> ${dept}<br>
            👨‍⚕️ <b>Doktor:</b> ${bestDoc.name}<br>
            📅 <b>Tarih:</b> ${displayDate}<br>
            ⏰ <b>Saat:</b> ${bestSlot}<br><br>
            Bu randevuyu oluşturmak istiyorsanız sol taraftaki formu kullanabilirsiniz. Formu sizin için doldurdum!`, 'assistant');
            
        // Formu Otomatik Doldur
        autoFillForm(hospital, dept, bestDoc.id, bestDateStr, bestSlot);
    } else {
        appendMessage(`Üzgünüm, önümüzdeki 7 gün içerisinde <b>${hospital} - ${dept}</b> bölümünde uygun boş saat bulunamadı.`, 'assistant');
    }
}

function autoFillForm(hospital, dept, docId, date, time) {
    hospitalSelect.value = hospital;
    hospitalSelect.dispatchEvent(new Event('change'));
    
    setTimeout(() => {
        departmentSelect.value = dept;
        departmentSelect.dispatchEvent(new Event('change'));
        
        setTimeout(() => {
            doctorSelect.value = docId;
            doctorSelect.dispatchEvent(new Event('change'));
            
            setTimeout(() => {
                dateSelect.value = date;
                dateSelect.dispatchEvent(new Event('change'));
                
                setTimeout(() => {
                    timeSelect.value = time;
                    timeSelect.dispatchEvent(new Event('change'));
                    
                    // Highlight form to draw attention
                    const formCard = document.querySelector('.card:first-child');
                    formCard.style.boxShadow = '0 0 0 4px var(--success)';
                    setTimeout(() => formCard.style.boxShadow = '', 2000);
                }, 100);
            }, 100);
        }, 100);
    }, 100);
}

// ================= Neyim Var Logic =================
const symptomInput = document.getElementById('symptomInput');
const analyzeSymptomBtn = document.getElementById('analyzeSymptomBtn');
const symptomResult = document.getElementById('symptomResult');

analyzeSymptomBtn?.addEventListener('click', async () => {
    const text = symptomInput.value.trim();
    if (!text) {
        showToast("Lütfen şikayetlerinizi yazın.", "warning");
        return;
    }

    symptomResult.style.display = 'block';
    symptomResult.innerHTML = '<p style="color: var(--text-muted);">Analiz ediliyor...</p>';

    try {
        const response = await fetch('http://localhost:3000/api/symptoms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) throw new Error('API yanıt vermedi');
        
        const data = await response.json();
        const recommendedDepts = data.departments;

        if (recommendedDepts && recommendedDepts.length > 0) {
            let deptsHtml = recommendedDepts.map(d => `<b>${d}</b>`).join(', ');
            symptomResult.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--primary); margin-bottom: 0.5rem;">
                    <span class="material-icons">check_circle</span>
                    <strong>Önerilen Bölümler:</strong>
                </div>
                <p style="margin: 0; color: var(--text-color);">${deptsHtml} bölümüne/bölümlerine görünmeniz uygun olabilir.</p>
            `;
        } else {
            symptomResult.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--warning); margin-bottom: 0.5rem;">
                    <span class="material-icons">info</span>
                    <strong>Sonuç Bulunamadı</strong>
                </div>
                <p style="margin: 0; color: var(--text-muted);">Şikayetinizden kesin bir bölüm çıkaramadım. Genel bir kontrol için <b>İç Hastalıkları (Dahiliye)</b> veya alanında uzman bir Aile Hekimine görünmenizi tavsiye ederim.</p>
            `;
        }
    } catch (error) {
        console.error('REST API Hatası:', error);
        symptomResult.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444; margin-bottom: 0.5rem;">
                <span class="material-icons">error</span>
                <strong>Bağlantı Hatası</strong>
            </div>
            <p style="margin: 0; color: var(--text-muted);">Sunucuya (REST API) ulaşılamadı. Lütfen Node.js sunucusunun çalıştığından emin olun.</p>
        `;
    }
});
