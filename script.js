// ==========================================
// إعدادات التطبيق
// ==========================================
// ⚠️ تأكد أن هذا الرابط هو رابط الـ CSV الخاص بك
const DASHBOARD_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSTyoz1HkTLwAtV-EJme4q3EMWXHZmQwMT-0FI2q5EQQWXj5u8VlaBRx45Iy27a-c91C88CWHSPFXp6/pub?output=csv";

// متغيرات النظام
let appData = {};
let popupWindow = null;
let monitorInterval = null;

// 1. التشغيل عند البداية
document.addEventListener('DOMContentLoaded', () => {
    // إخفاء السبلاش بعد 2.5 ثانية
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
        }
    }, 2500);

    fetchData(); // جلب البيانات
    
    // تحديث تلقائي كل 30 ثانية
    setInterval(fetchData, 30000); 
});

// 2. جلب بيانات الداشبورد (مع كسر الكاش)
async function fetchData() {
    try {
        // نضيف رقم عشوائي للرابط لإجبار المتصفح على جلب نسخة جديدة
        const cacheBuster = "&nocache=" + Math.random();
        const response = await fetch(DASHBOARD_CSV + cacheBuster);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        parseCSV(text);
        updateUI();
    } catch (error) {
        console.error("Connection Error", error);
        const statusText = document.getElementById('attend-status-text');
        const btn = document.getElementById('btn-attendance');
        
        if (statusText) {
            // عرض رسالة الخطأ الحقيقية للمساعدة في الحل
            statusText.innerText = "خطأ في الاتصال: " + error.message;
            statusText.style.color = "red";
            statusText.style.direction = "ltr"; // لعرض الخطأ الإنجليزي بشكل صحيح
        }
        
        if (btn) {
            btn.classList.add('btn-disabled');
            btn.innerText = "⚠️ النظام متوقف";
        }
    }
}

// 3. تحليل ملف CSV (نسخة محسنة وآمنة 🛡️)
function parseCSV(csvText) {
    if (!csvText) return;
    
    const rows = csvText.split('\n');
    rows.forEach(row => {
        // تخطي الأسطر الفارغة تماماً
        if (!row || row.trim() === '') return;

        const cols = row.split(',');

        if(cols.length >= 2) {
            // تنظيف المفتاح (العمود A)
            const key = cols[0].replace(/"/g, '').trim();
            
            // تنظيف القيمة (العمود B فقط) مع التأكد من وجودها
            // استخدام (cols[1] || "") يمنع الخطأ إذا كان العمود فارغاً
            let val = (cols[1] || "").replace(/"/g, '').trim(); 
            
            if (key) {
                appData[key] = val;
            }
        }
    });
}

// 4. تحديث الواجهة (القلب النابض)
function updateUI() {
    // === تحديث زر التحضير ===
    const btn = document.getElementById('btn-attendance');
    const msg = document.getElementById('attend-status-text');
    const dot = document.getElementById('connection-dot');
    
    // قراءة الحالة وتنظيفها
    let rawStatus = appData['attendance_status'];
    let status = rawStatus ? rawStatus.toString().toUpperCase().trim() : "CLOSED";
    
    // التحقق المرن (يقبل OPEN, Open, open, TRUE, ON)
    if (status === 'OPEN' || status === 'TRUE' || status === 'ON') {
        // الحالة: مفتوح ✅
        if (btn) {
            btn.classList.remove('btn-disabled');
            btn.innerHTML = "🚀 سجّل حضورك الآن";
            btn.onclick = openAttendance; // تفعيل الضغط
        }
        
        if (msg) {
            msg.innerHTML = "● البوابة مفتوحة الآن";
            msg.style.color = "#10b981"; // أخضر
            msg.style.direction = "rtl";
        }
        
        if(dot) dot.style.background = "#10b981";
    } else {
        // الحالة: مغلق 🔒
        if (btn) {
            btn.classList.add('btn-disabled');
            btn.innerHTML = "🔒 التحضير مغلق";
            btn.onclick = null; // تعطيل الضغط
        }
        
        if (msg) {
            msg.innerHTML = "● بانتظار فتح النظام...";
            msg.style.color = "#64748b"; // رمادي
            msg.style.direction = "rtl";
        }
        
        if(dot) dot.style.background = "#ef4444"; // أحمر
    }

    // === تحديث الروابط الأخرى ===
    if(appData['assignment_link']) {
        const assignBtn = document.getElementById('btn-assignment');
        if(assignBtn) assignBtn.href = appData['assignment_link'];
    }
    
    if(appData['certificate_link']) {
        const certBtn = document.getElementById('btn-cert');
        if(certBtn) certBtn.href = appData['certificate_link'];
    }
    
    if(appData['powerbi_link']) {
        const biBtn = document.getElementById('btn-powerbi');
        if(biBtn) biBtn.href = appData['powerbi_link'];
    }
    
    // === تحديث شريط الإعلانات ===
    const announceBar = document.getElementById('announcement-bar');
    const announceTextEl = document.getElementById('announcement-text');
    const announceText = appData['announcement_text'];
    
    // التحقق أن النص ليس فارغاً وليس نص الملاحظات
    if (announceBar && announceText && announceText.length > 2 && !announceText.includes("المتحرك")) {
        announceBar.classList.remove('hidden');
        if(announceTextEl) {
            announceTextEl.innerText = announceText;
        }
    } else if (announceBar) {
        announceBar.classList.add('hidden');
    }
}

// دالة لإغلاق الإعلان
function closeAnnouncement() {
    const announceBar = document.getElementById('announcement-bar');
    if (announceBar) {
        announceBar.classList.add('hidden');
    }
}

// 5. فتح نافذة التحضير
function openAttendance() {
    const scriptUrl = appData['attendance_link']; 
    
    if (!scriptUrl || scriptUrl.length < 5) {
        alert("تنبيه: رابط التحضير غير موجود في لوحة التحكم (Google Sheet)");
        return;
    }

    // فتح نافذة منبثقة احترافية
    const w = 500, h = 650;
    const left = (screen.width/2)-(w/2);
    const top = (screen.height/2)-(h/2);
    
    popupWindow = window.open(scriptUrl, "Attendance", `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,resizable=yes`);
    
    // إظهار نافذة المراقبة داخل الموقع
    const modal = document.getElementById('monitor-modal');
    if (modal) modal.classList.add('active');
    
    startMonitoring();
}

// 6. مراقبة النافذة
function startMonitoring() {
    if (monitorInterval) clearInterval(monitorInterval);
    
    monitorInterval = setInterval(() => {
        if (popupWindow && popupWindow.closed) {
            // إذا أغلقت النافذة (يعني الطالب انتهى أو أغلقها)
            clearInterval(monitorInterval);
            const modal = document.getElementById('monitor-modal');
            if (modal) modal.classList.remove('active');
            showToast();
        }
    }, 1000);
}

function forceCloseMonitor() {
    const modal = document.getElementById('monitor-modal');
    if (modal) modal.classList.remove('active');
    clearInterval(monitorInterval);
}

function showToast() {
    const t = document.getElementById('toast');
    if (t) {
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 4000);
    }
}

// 7. التنقل بين التبويبات
function switchTab(tabId, el) {
    document.querySelectorAll('.view-section').forEach(d => d.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
}