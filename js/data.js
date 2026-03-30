// Mock veri tanımlamaları
const DEFAULT_HOSPITALS = [
    'Ankara Şehir Hastanesi',
    'Ankara Hacettepe Üniversitesi Hastanesi',
    'İstanbul Çam ve Sakura Şehir Hastanesi',
    'İstanbul Cerrahpaşa Tıp Fakültesi',
    'İzmir Tepecik Eğitim ve Araştırma Hastanesi',
    'İzmir Ege Üniversitesi Tıp Fakültesi',
    'Antalya Eğitim ve Araştırma Hastanesi',
    'Bursa Şehir Hastanesi',
    'Adana Şehir Hastanesi'
];

const DEFAULT_DEPARTMENTS = [
    'Dahiliye',
    'Göz Hastalıkları',
    'Kardiyoloji',
    'Ortopedi',
    'Cildiye',
    'Nöroloji',
    'Genel Cerrahi',
    'Psikiyatri',
    'Çocuk Sağlığı ve Hastalıkları',
    'Kulak Burun Boğaz (KBB)'
];

const DEFAULT_DOCTORS = [
    // Bu liste artık dinamik olarak üretilecek veya localStorage'dan okunacak
];

const MALE_NAMES = ["Ahmet", "Mehmet", "Ali", "Mustafa", "Can", "Burak", "Emre", "Murat", "Hakan", "Volkan", "Kenan", "Yılmaz", "Kemal", "Tarık"];
const FEMALE_NAMES = ["Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Aslı", "Ebru", "Esra", "Büşra", "Ceren", "Derya", "Filiz", "Hülya"];
const SURNAMES = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Polat", "Aydın", "Öztürk", "Arslan", "Koç", "Doğan", "Kılıç"];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Varsayılan doktorları her hastane ve her bölüm için 1 erkek, 1 kadın olarak üretir
function generateDefaultDoctors() {
    const doctors = [];
    let idCounter = 1;

    DEFAULT_HOSPITALS.forEach(hospital => {
        DEFAULT_DEPARTMENTS.forEach(department => {
            // 1 Male Doctor
            const maleName = getRandomItem(MALE_NAMES);
            const maleSurname = getRandomItem(SURNAMES);
            doctors.push({
                id: `d${idCounter}`,
                name: `Dr. ${maleName} ${maleSurname}`,
                hospital: hospital,
                department: department,
                email: `dr.${maleName.toLowerCase()}.${maleSurname.toLowerCase()}@mhrs.com`,
                password: '123'
            });
            idCounter++;

            // 1 Female Doctor
            const femaleName = getRandomItem(FEMALE_NAMES);
            const femaleSurname = getRandomItem(SURNAMES);
            doctors.push({
                id: `d${idCounter}`,
                name: `Dr. ${femaleName} ${femaleSurname}`,
                hospital: hospital,
                department: department,
                email: `dr.${femaleName.toLowerCase()}.${femaleSurname.toLowerCase()}@mhrs.com`,
                password: '123'
            });
            idCounter++;
        });
    });
    return doctors;
}

// Veritabanını başlatma
function initData() {
    if (!localStorage.getItem('appointments')) {
        localStorage.setItem('appointments', JSON.stringify([]));
    }
    if (!localStorage.getItem('patients')) {
        localStorage.setItem('patients', JSON.stringify([]));
    }
    
    // Check if doctors are generated with the old strategy, or simply don't exist
    let existingDoctors = JSON.parse(localStorage.getItem('doctors'));
    let needsUpdate = false;
    
    if (!existingDoctors || existingDoctors.length === 0) {
        needsUpdate = true;
    } else if (existingDoctors[0].name.includes("Uzmanı")) {
        // Eski jenerasyon silinip yenisi yazılsın
        needsUpdate = true; 
    }

    if (needsUpdate) {
        const defaultDoctors = generateDefaultDoctors();
        localStorage.setItem('doctors', JSON.stringify(defaultDoctors));
    }
}

// Randevuları getirme
function getAppointments() {
    return JSON.parse(localStorage.getItem('appointments')) || [];
}

// Randevuları kaydetme
function saveAppointments(appointments) {
    localStorage.setItem('appointments', JSON.stringify(appointments));
}

// Doktorları getirme
function getDoctors() {
    return JSON.parse(localStorage.getItem('doctors')) || [];
}

// Doktorları kaydetme
function saveDoctors(doctors) {
    localStorage.setItem('doctors', JSON.stringify(doctors));
}

// Hastaları getirme
function getPatients() {
    return JSON.parse(localStorage.getItem('patients')) || [];
}

// Hastaları kaydetme
function savePatients(patients) {
    localStorage.setItem('patients', JSON.stringify(patients));
}

// Randevuları getirme
function getAppointments() {
    return JSON.parse(localStorage.getItem('appointments')) || [];
}

// Randevuları kaydetme
function saveAppointments(appointments) {
    localStorage.setItem('appointments', JSON.stringify(appointments));
}

// Giriş yapan kullanıcıyı kaydetme/alabilme
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

initData();
