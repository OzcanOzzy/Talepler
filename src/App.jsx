import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { 
  Mic, Send, Plus, Trash2, Download, Settings, Upload,
  X, User, Phone, Pencil, Smartphone, Menu, CheckSquare, Briefcase, Map, Home,
  Calendar, Bell, BellOff, Clock, Tag, Filter, ArrowUpDown, Banknote, FileText,
  Sprout, Flower, MapPin, Key, Store, Wallet, Volume2, LogOut, Loader2, CalendarDays, ChevronLeft, ChevronRight, Lock, AlertTriangle, RefreshCcw, FolderInput
} from 'lucide-react';

// --- HATA KALKANI ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uygulama Hatası:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-red-50 text-red-900 text-center">
          <AlertTriangle size={64} className="mb-4 text-red-600"/>
          <h1 className="text-2xl font-bold mb-2">Bir Hata Oluştu</h1>
          <p className="text-sm mb-4 bg-white p-4 rounded border border-red-200 font-mono text-left w-full overflow-auto">
            {this.state.error?.toString()}
          </p>
          <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all flex items-center gap-2">
             <RefreshCcw size={20}/> Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children; 
  }
}

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
  apiKey: "AIzaSyD6ZVlcJYZPfJ5RQEWZGnrh4sBmwHS9_2U",
  authDomain: "randevular-talepler.firebaseapp.com",
  projectId: "randevular-talepler",
  storageBucket: "randevular-talepler.firebasestorage.app",
  messagingSenderId: "313283650196",
  appId: "1:313283650196:web:8052099b467fc25fb88a81"
};

// --- Firebase Başlatma ---
let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase Başlatma Hatası:", e);
}

// --- ANA İÇERİK ---
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const defaultCategories = [
    { id: 'cat_randevu', title: 'Randevular', keywords: 'randevu,görüşme,buluşma,toplantı,yarın,saat,gösterilecek,gösterim,sunum,bakılacak', items: [], icon: 'calendar' },
    { id: 'cat_todo', title: 'Yapılacaklar', keywords: 'yapılacak,hatırlat,alınacak,git,gel,ara,sor,gönder,hazırla,not', items: [], icon: 'check' },
    { id: 'cat_konut', title: 'Konut', keywords: 'ev,daire,konut,villa,yalı,rezidans,bina,site,kat,apartman,stüdyo', items: [], icon: 'home' },
    { id: 'cat_ticari', title: 'Ticari', keywords: 'ofis,dükkan,depo,işyeri,plaza,mağaza,fabrika,imalathane,büro', items: [], icon: 'store' },
    { id: 'cat_devren', title: 'Devren', keywords: 'devren,devir,devredilecek,isim hakkı', items: [], icon: 'key' },
    { id: 'cat_arsa', title: 'Arsa', keywords: 'arsa,arazi,parsel,imarlı,yatırım,metrekare,tek tapu,hisseli,ifrazlı', items: [], icon: 'map' },
    { id: 'cat_tarla', title: 'Tarla', keywords: 'tarla,ekim,biçim,sulak,kuru,dönüm,tarım', items: [], icon: 'sprout' },
    { id: 'cat_bahce', title: 'Bahçe', keywords: 'bahçe,meyve,ağaç,fidan,hobi bahçesi,bağ', items: [], icon: 'flower' }
  ];

  const defaultCities = [
    { id: 'city_eregli', title: 'Ereğli', keywords: 'ereğli,toros,toros mahallesi,toki,organize' },
    { id: 'city_konya', title: 'Konya', keywords: 'konya,meram,selçuklu,karatay,bosna' },
    { id: 'city_karaman', title: 'Karaman', keywords: 'karaman,ermenek' },
    { id: 'city_alanya', title: 'Alanya', keywords: 'alanya,mahmutlar,kestel' },
    { id: 'city_eskisehir', title: 'Eskişehir', keywords: 'eskişehir,odunpazarı,tepebaşı' }
  ];

  const defaultTags = ["1+1", "2+1", "3+1", "4+1", "Müstakil", "Eşyalı", "Yatırımlık", "Garajlı", "Site İçinde", "Ara Kat", "Zemin Kat", "Güney Cephe", "Kuzey Cephe", "Sıfır"];

  const [categories, setCategories] = useState(defaultCategories);
  const [cities, setCities] = useState(defaultCities);
  const [availableTags, setAvailableTags] = useState(defaultTags);
  const [lastAdNumber, setLastAdNumber] = useState(1000);

  const [activeTabId, setActiveTabId] = useState('cat_randevu');
  const [activeCityFilter, setActiveCityFilter] = useState('all'); 
  const [activeDealType, setActiveDealType] = useState('all'); 
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortOption, setSortOption] = useState('date_desc');
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);
  const [calendarInputText, setCalendarInputText] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showManualContactModal, setShowManualContactModal] = useState(false);
  const [showTagManagerModal, setShowTagManagerModal] = useState(false);
  const [showCityManagerModal, setShowCityManagerModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [editingCategoryData, setEditingCategoryData] = useState({ id: '', title: '', keywords: '' });
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatKeywords, setNewCatKeywords] = useState('');
  const [newCityTitle, setNewCityTitle] = useState('');
  const [newCityKeywords, setNewCityKeywords] = useState('');
  const [manualContactName, setManualContactName] = useState('');
  const [manualContactPhone, setManualContactPhone] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [importTarget, setImportTarget] = useState('auto');

  const alarmSound = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
        if(loading) {
            setLoading(false);
            setErrorMsg("Bağlantı çok yavaş veya veritabanına erişilemiyor. Sayfayı yenileyip tekrar deneyin.");
        }
    }, 15000);

    if (!auth) { 
      setErrorMsg("Firebase başlatılamadı. Lütfen internet bağlantınızı kontrol edin."); 
      setLoading(false); 
      return; 
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const unsubscribeData = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if(data.categories && Array.isArray(data.categories)) setCategories(data.categories);
            if(data.cities) setCities(data.cities);
            if(data.tags) setAvailableTags(data.tags);
            if(data.lastAdNumber) setLastAdNumber(data.lastAdNumber);
          } else {
            saveToCloud(defaultCategories, defaultCities, defaultTags, 1000, currentUser);
          }
          setLoading(false); 
          clearTimeout(timeout);
        }, (error) => {
           console.error("Veri Hatası:", error);
           setErrorMsg("Veri okunamadı: " + error.message);
           setLoading(false);
           clearTimeout(timeout);
        });
        return () => unsubscribeData();
      } else {
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    try {
      alarmSound.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    } catch(e) { console.error("Ses", e); }
    
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => {
        unsubscribeAuth();
        clearTimeout(timeout);
    };
  }, []);

  const saveToCloud = async (newCats, newCities, newTags, newAdNum, currentUser = user) => {
    if (!currentUser || !db) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        categories: newCats,
        cities: newCities,
        tags: newTags,
        lastAdNumber: newAdNum,
        ownerEmail: currentUser.email,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Kayıt Hatası:", e);
      setFeedbackMsg("⚠️ Kayıt Başarısız!");
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (error) { alert("Giriş Hatası: " + error.message); }
  };
  const handleLogout = () => signOut(auth);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      categories.forEach(cat => {
        cat.items.forEach(item => {
          if (item.alarmActive && item.alarmTime) {
            const diff = now - new Date(item.alarmTime);
            if (diff >= 0 && diff < 60000) triggerNotification(item.text);
          }
        });
      });
    }, 30000); 
    return () => clearInterval(interval);
  }, [categories]);

  const triggerNotification = (text) => {
    if(alarmSound.current) alarmSound.current.play().catch(e=>console.log(e));
    if (Notification.permission === "granted") {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
         navigator.serviceWorker.ready.then(reg => reg.showNotification("Emlak Asistanı", { body: text, icon: 'https://i.hizliresim.com/arpast7.jpeg', vibrate: [200, 100, 200] }));
      } else {
        new Notification("Emlak Asistanı", { body: text, icon: 'https://i.hizliresim.com/arpast7.jpeg' });
      }
    }
  };

  const testAlarm = () => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then(p => { if(p==="granted") triggerNotification("Test Başarılı!"); else alert("İzin verilmedi."); });
    } else triggerNotification("Test Başarılı!");
  };

  const addToGoogleCalendar = (item) => {
    if (!item.alarmTime) return alert("Lütfen önce bir alarm tarihi belirleyin.");
    const startDate = new Date(item.alarmTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Randevu: " + (item.contactName || "Müşteri"))}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(item.text + "\nTel: " + item.phone)}`;
    window.open(url, '_blank');
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); 
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const extractInfo = (text) => {
    const phoneRegex = /(0?5\d{2})[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})|(\d{10,11})/;
    const phoneMatch = text.match(phoneRegex);
    let phone = ''; if (phoneMatch) phone = phoneMatch[0];
    let price = 0;
    const lowerText = text.toLocaleLowerCase('tr-TR');
    const millionMatch = lowerText.match(/(\d+([.,]\d+)?)\s*milyon/);
    if (millionMatch) price = parseFloat(millionMatch[1].replace(',', '.')) * 1000000;
    else {
      const thousandMatch = lowerText.match(/(\d+([.,]\d+)?)\s*bin/);
      if (thousandMatch) price = parseFloat(thousandMatch[1].replace(',', '.')) * 1000;
      else {
        const rawMoneyMatch = lowerText.match(/(\d{1,3}(?:[.,]\d{3})*)\s*(tl|lira)/);
        if (rawMoneyMatch) price = parseFloat(rawMoneyMatch[1].replace(/\./g, '').replace(/,/g, '.'));
      }
    }
    return { phone, text, price };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const lines = content.split(/\r?\n/);
      let importedCount = 0;
      let currentAdNo = lastAdNumber;
      let tempCategories = [...categories];
      lines.forEach(line => {
        if (!line.trim()) return;
        let cleanText = line.replace(/^[\d-]+\.?\s*/, '').trim();
        if(!cleanText) return;
        let { phone, text, price } = extractInfo(cleanText);
        const now = new Date();
        const fullDate = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}`;
        const detectedTags = availableTags.filter(tag => cleanText.toLocaleLowerCase('tr-TR').includes(tag.toLocaleLowerCase('tr-TR')));
        let detectedCityId = null; let detectedCityName = '';
        for (const city of cities) { if (city.keywords.split(',').map(k=>k.trim()).some(k=>cleanText.toLowerCase().includes(k))) { detectedCityId = city.id; detectedCityName = city.title; break; } }
        let dealType = 'sale'; if (cleanText.toLowerCase().includes('kira')) dealType = 'rent';
        
        let targetCatId = 'cat_todo';
        if (importTarget !== 'auto') targetCatId = importTarget;
        else {
             const priorityOrder = ['cat_randevu', 'cat_devren', 'cat_ticari', 'cat_tarla', 'cat_bahce', 'cat_arsa', 'cat_konut'];
             for (const catId of priorityOrder) {
               const cat = tempCategories.find(c => c.id === catId);
               if (cat && cat.keywords.split(',').some(k=>cleanText.toLowerCase().includes(k.trim()))) { targetCatId = cat.id; break; }
             }
        }
        currentAdNo++;
        const newItem = { id: Date.now() + Math.random(), adNo: currentAdNo, text: cleanText, phone, contactName: '', date: fullDate, price, alarmTime: '', alarmActive: false, tags: detectedTags, cityId: detectedCityId, cityName: detectedCityName, dealType };
        tempCategories = tempCategories.map(c => { if (c.id === targetCatId) { return { ...c, items: [newItem, ...c.items] }; } return c; });
        importedCount++;
      });
      setCategories(tempCategories);
      setLastAdNumber(currentAdNo);
      saveToCloud(tempCategories, cities, availableTags, currentAdNo);
      setFeedbackMsg(`${importedCount} kayıt yüklendi!`);
      setShowImportModal(false);
    };
    reader.readAsText(file, "UTF-8");
  };

  const processCommand = (rawText, specificContact = null, forcedDate = null) => {
    if (!rawText.trim() && !specificContact) return;
    
    let textToProcess = rawText.replace(/(\d)\s*\+\s*(\d)/g, '$1+$2'); 
    const now = new Date();
    const fullDate = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}`;
    const timestamp = Date.now();
    const lowerText = textToProcess.toLocaleLowerCase('tr-TR');
    let { phone, text, price } = extractInfo(textToProcess);
    let contactName = '';
    if (specificContact) { contactName = specificContact.name; if (specificContact.tel) phone = specificContact.tel; } 
    let detectedCityId = null; let detectedCityName = '';
    for (const city of cities) {
      const cityKeys = city.keywords.split(',').map(k => k.trim().toLocaleLowerCase('tr-TR')).filter(k => k !== '');
      if (cityKeys.some(key => lowerText.includes(key))) { detectedCityId = city.id; detectedCityName = city.title; break; }
    }
    let dealType = 'sale'; 
    if (lowerText.includes('kiralık') || lowerText.includes('kira')) dealType = 'rent'; 
    else if (lowerText.includes('satılık')) dealType = 'sale';
    const detectedTags = availableTags.filter(tag => lowerText.includes(tag.toLocaleLowerCase('tr-TR')));
    const newAdNo = lastAdNumber + 1;
    let alarmTime = '';
    let alarmActive = false;
    if (forcedDate) {
        const d = new Date(forcedDate); d.setHours(9, 0, 0, 0);
        const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
        alarmTime = `${year}-${month}-${day}T09:00`; alarmActive = true;
    }
    const newItem = { id: timestamp, adNo: newAdNo, text: text, phone, contactName, date: fullDate, price, alarmTime: alarmTime, alarmActive: alarmActive, tags: detectedTags, cityId: detectedCityId, cityName: detectedCityName, dealType: dealType };
    let targetCategoryId = 'cat_todo';
    const appointmentTriggers = ['randevu', 'gösterim', 'gösterilecek', 'sunum', 'yer gösterme', 'bakılacak', 'yarın', 'saat', 'toplantı'];
    const isAppointment = appointmentTriggers.some(trigger => lowerText.includes(trigger));
    if (forcedDate || isAppointment) { targetCategoryId = 'cat_randevu'; } 
    else if (lowerText.includes('devren')) { targetCategoryId = 'cat_devren'; } 
    else {
        const priorityOrder = ['cat_ticari', 'cat_tarla', 'cat_bahce', 'cat_arsa', 'cat_konut'];
        for (const catId of priorityOrder) {
          const cat = categories.find(c => c.id === catId);
          if (cat) {
            const keys = cat.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k !== '');
            if (keys.some(key => lowerText.includes(key))) { targetCategoryId = cat.id; break; }
          }
        }
    }
    const newCategories = categories.map(c => { if (c.id === targetCategoryId) { return { ...c, items: [newItem, ...c.items] }; } return c; });
    setCategories(newCategories);
    setLastAdNumber(newAdNo);
    saveToCloud(newCategories, cities, availableTags, newAdNo); 
    const targetCategory = categories.find(c => c.id === targetCategoryId);
    setFeedbackMsg(`✅ #${newAdNo} - "${targetCategory?.title}" eklendi.`);
    setActiveTabId(targetCategoryId);
    if(detectedCityId) setActiveCityFilter(detectedCityId);
    setInputText('');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const deleteItem = (catId, itemId) => {
    if(!confirm("Silmek istediğinize emin misiniz?")) return;
    const newCategories = categories.map(c => { if (c.id === catId) return {...c, items: c.items.filter(i => i.id !== itemId)}; return c; });
    setCategories(newCategories);
    saveToCloud(newCategories, cities, availableTags, lastAdNumber);
  };

  const saveItemChanges = () => {
    if (!editingItem) return;
    
    let newCategories = [...categories];
    const { originalCatId, targetCatId, item } = editingItem;

    if (originalCatId === targetCatId) {
      // Aynı kategori içinde güncelleme
      newCategories = newCategories.map(c => {
        if (c.id === originalCatId) {
          return { ...c, items: c.items.map(i => i.id === item.id ? item : i) };
        }
        return c;
      });
    } else {
      // Taşıma işlemi
      newCategories = newCategories.map(c => {
        if (c.id === originalCatId) {
          // Eskisinden sil
          return { ...c, items: c.items.filter(i => i.id !== item.id) };
        }
        return c;
      });
      newCategories = newCategories.map(c => {
        if (c.id === targetCatId) {
          // Yenisine ekle
          return { ...c, items: [item, ...c.items] };
        }
        return c;
      });
    }

    setCategories(newCategories);
    saveToCloud(newCategories, cities, availableTags, lastAdNumber);
    setEditingItem(null);
  };

  const handleCalendarAdd = () => { if(!calendarInputText) return; processCommand(calendarInputText, null, calendarSelectedDate); setCalendarSelectedDate(null); setCalendarInputText(''); };
  const startListeningCalendar = () => { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) return alert("Desteklenmiyor"); const recognition = new SpeechRecognition(); recognition.lang = 'tr-TR'; recognition.onstart = () => setIsListening(true); recognition.onend = () => setIsListening(false); recognition.onresult = (e) => setCalendarInputText(e.results[0][0].transcript); recognition.start(); };
  
  const getProcessedItems = (items) => {
    let result = [...items];
    if (activeCityFilter !== 'all') { result = result.filter(item => item.cityId === activeCityFilter); }
    if (activeDealType !== 'all' && activeTabId !== 'cat_todo' && activeTabId !== 'cat_randevu') { result = result.filter(item => item.dealType === activeDealType); }
    if (activeFilters.length > 0) { result = result.filter(item => activeFilters.every(filterTag => item.tags && item.tags.includes(filterTag))); }
    if (priceFilter.min !== '') { result = result.filter(item => item.price >= parseFloat(priceFilter.min)); }
    if (priceFilter.max !== '') { result = result.filter(item => item.price <= parseFloat(priceFilter.max)); }
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date_asc': return a.id - b.id;
        case 'date_desc': return b.id - a.id;
        case 'price_asc': if (!a.price) return 1; if (!b.price) return -1; return a.price - b.price;
        case 'price_desc': if (!a.price) return 1; if (!b.price) return -1; return b.price - a.price;
        default: return b.id - a.id;
      }
    });
    return result;
  };

  const formatCurrency = (amount) => { if (!amount) return ''; return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount); };
  const toggleFilter = (tag) => { if (activeFilters.includes(tag)) setActiveFilters(activeFilters.filter(t => t !== tag)); else setActiveFilters([...activeFilters, tag]); };
  const handleContactPick = async () => { if ('contacts' in navigator && 'ContactsManager' in window) { try { const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false }); if (contacts.length) setInputText(`${contacts[0].name[0]} (${contacts[0].tel ? contacts[0].tel[0] : ''}) - `); } catch (ex) { setShowManualContactModal(true); } } else { setShowManualContactModal(true); } };
  
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Ses desteği yok.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
      processCommand(transcript);
    };
    recognition.start();
  };

  // --- FORMATLI İNDİRME FONKSİYONU (YENİ) ---
  const downloadFile = (content, filename) => {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/plain;charset=utf-8' });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = filename;
    document.body.appendChild(element); element.click(); document.body.removeChild(element);
  };

  const formatItemForReport = (item) => {
      let report = `--------------------------------------------------\r\n`;
      report += `İLAN NO: #${item.adNo || '---'}\r\n`;
      report += `TARİH: ${item.date}\r\n`;
      
      if(item.dealType) report += `İŞLEM: ${item.dealType === 'rent' ? 'KİRALIK' : 'SATILIK'}\r\n`;
      if(item.cityName) report += `ŞEHİR: ${item.cityName.toUpperCase()}\r\n`;
      
      if(item.contactName || item.phone) {
          report += `MÜŞTERİ: ${item.contactName || 'Belirtilmedi'}\r\n`;
          report += `TELEFON: ${item.phone || '-'}\r\n`;
      }
      
      if(item.price) report += `FİYAT: ${formatCurrency(item.price)}\r\n`;
      if(item.tags && item.tags.length > 0) report += `ETİKETLER: ${item.tags.join(', ')}\r\n`;
      
      report += `\r\nAÇIKLAMA:\r\n${item.text}\r\n`;
      report += `--------------------------------------------------\r\n\r\n`;
      return report;
  };

  const downloadAllData = () => {
    // Tüm kategorileri birleştir, tarihe göre sırala (en yeni en üstte)
    let allItems = [];
    categories.forEach(cat => {
        cat.items.forEach(item => {
            allItems.push({...item, catTitle: cat.title});
        });
    });

    if (allItems.length === 0) return alert("İndirilecek veri yok.");

    // Sıralama: İlan Numarasına Göre (Büyükten küçüğe = En Yeni)
    allItems.sort((a, b) => (b.adNo || 0) - (a.adNo || 0));

    let content = `EMLAK ASİSTANI - TAM YEDEK\r\nOluşturma: ${new Date().toLocaleString('tr-TR')}\r\nTopam Kayıt: ${allItems.length}\r\n\r\n`;
    
    allItems.forEach(item => {
        content += `>>> BÖLÜM: ${item.catTitle.toUpperCase()} <<<\r\n`;
        content += formatItemForReport(item);
    });

    downloadFile(content, `Tum_Liste_${new Date().toLocaleDateString().replace(/\./g, '_')}.txt`);
    setShowMenu(false);
  };

  const downloadFilteredData = () => {
    const activeCategory = categories.find(c => c.id === activeTabId) || categories[0];
    const filteredItems = getProcessedItems(activeCategory.items);
    
    if (filteredItems.length === 0) return alert("Bu ekranda veri yok.");

    // Sıralama (İlan No)
    filteredItems.sort((a, b) => (b.adNo || 0) - (a.adNo || 0));

    let content = `EMLAK ASİSTANI - ${activeCategory.title.toUpperCase()} RAPORU\r\nOluşturma: ${new Date().toLocaleString('tr-TR')}\r\n\r\n`;
    
    filteredItems.forEach(item => {
        content += formatItemForReport(item);
    });

    downloadFile(content, `${activeCategory.title}_Raporu.txt`);
    setShowMenu(false);
  };

  const getIcon = (icon) => {
    if(icon==='home') return <Home size={16}/>;
    if(icon==='map') return <Map size={16}/>;
    if(icon==='calendar') return <Calendar size={16}/>;
    if(icon==='check') return <CheckSquare size={16}/>;
    if(icon==='sprout') return <Sprout size={16}/>;
    if(icon==='flower') return <Flower size={16}/>;
    if(icon==='store') return <Store size={16}/>;
    if(icon==='key') return <Key size={16}/>;
    return <Briefcase size={16}/>;
  }

  const addNewCity = () => { if (!newCityTitle) return; setCities([...cities, { id: `city_${Date.now()}`, title: newCityTitle, keywords: newCityKeywords }]); setNewCityTitle(''); setNewCityKeywords(''); };
  const removeCity = (cityId) => { if(confirm("Silinsin mi?")) setCities(cities.filter(c => c.id !== cityId)); };

  if (errorMsg) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center">
        <AlertTriangle size={64} className="text-red-500 mb-4"/>
        <h1 className="text-2xl font-bold mb-2">Bir Sorun Oluştu</h1>
        <p className="text-slate-300 text-sm mb-6">{errorMsg}</p>
        <button onClick={()=>window.location.reload()} className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold flex items-center gap-2"><RefreshCcw size={16}/> Sayfayı Yenile</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-blue-600 mb-4 text-4xl">●</div>
        <p className="text-slate-500 text-sm animate-pulse">Veriler Buluttan Alınıyor...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <img src="https://i.hizliresim.com/arpast7.jpeg" className="w-32 h-32 rounded-2xl shadow-2xl mb-6"/>
        <h1 className="text-2xl font-bold mb-1">Emlak Asistanı Pro</h1>
        <p className="text-blue-300 text-sm mb-8 font-bold tracking-widest">CLOUD V35</p>
        <button onClick={handleLogin} className="bg-white text-slate-900 py-3 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 shadow-lg">
           <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5"/> Google ile Giriş Yap
        </button>
      </div>
    );
  }

  const activeCategory = categories.find(c => c.id === activeTabId) || categories[0];
  const displayItems = getProcessedItems(activeCategory.items);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* ÜST BAR */}
      <div className="bg-slate-900 text-white p-2 flex justify-between items-center shadow-lg z-30 h-14">
        <div className="flex items-center gap-2">
          <img src="https://i.hizliresim.com/arpast7.jpeg" alt="Logo" className="w-10 h-10 object-cover rounded-md border border-slate-600"/>
          <div className="flex flex-col justify-center h-full pt-1">
            <h1 className="font-bold text-xs text-orange-400 leading-tight">Talep - Randevu Asistanı</h1>
            <div className="flex items-center gap-2 mt-0">
               <img src="https://i.hizliresim.com/fa4ibjl.png" alt="Icon" className="h-9 w-auto object-contain"/>
               <div className="flex flex-col">
                  <p className="text-[0.5rem] font-bold text-blue-300 uppercase tracking-wider leading-none">Pro V35</p>
                  <p className="text-[0.5rem] text-slate-400 flex items-center gap-0.5"><Lock size={8}/> {user.displayName ? user.displayName.split(' ')[0] : 'Kullanıcı'}</p>
               </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1 items-center">
           <button onClick={() => setShowFilters(!showFilters)} className="p-1.5 rounded-md hover:bg-slate-700"><Filter size={18} color="white"/></button>
           <button onClick={() => setShowAddModal(true)} className="p-1.5 rounded-md hover:bg-slate-700"><Plus size={18} color="white"/></button>
           <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-md hover:bg-slate-700">
             {showMenu ? <X size={18} color="white"/> : <Menu size={18} color="white"/>}
           </button>
        </div>
      </div>

      {/* MENÜ */}
      {showMenu && (
        <div className="absolute top-14 right-2 bg-white rounded-xl shadow-2xl border border-slate-300 z-[100] w-64 p-2 animate-in slide-in-from-top-2">
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <p className="text-xs font-bold text-slate-800">{user.displayName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
          <button onClick={testAlarm} className="w-full text-left px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg flex gap-2 font-bold mb-1 border border-green-200">
            <Volume2 size={16}/> Bildirim ve Sesi Test Et
          </button>
          <div className="h-px bg-slate-100 my-1"></div>
          <button onClick={() => {setShowImportModal(true); setShowMenu(false);}} className="w-full text-left px-3 py-2 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg flex gap-2 font-bold mb-1 border border-purple-200"><Upload size={16}/> Veri Yükle (.txt)</button>
          <button onClick={downloadAllData} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 rounded-lg flex gap-2"><Download size={16}/> Tüm Verileri İndir</button>
          <button onClick={downloadFilteredData} className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex gap-2 font-medium"><FileText size={16}/> Şu Anki Listeyi İndir</button>
          <div className="h-px bg-slate-100 my-1"></div>
          <button onClick={() => {setShowCityManagerModal(true); setShowMenu(false);}} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg flex gap-2"><MapPin size={16}/> Şehirleri Düzenle</button>
          <button onClick={() => {setEditingCategoryData({...activeCategory}); setShowEditCategoryModal(true); setShowMenu(false);}} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg flex gap-2"><Pencil size={16}/> Bölümü Düzenle</button>
          <button onClick={() => {setShowTagManagerModal(true); setShowMenu(false);}} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg flex gap-2"><Tag size={16}/> Etiketleri Düzenle</button>
          <div className="h-px bg-slate-100 my-1"></div>
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex gap-2 font-bold"><LogOut size={16}/> Çıkış Yap</button>
        </div>
      )}

      {/* KATEGORİLER */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto z-10 scrollbar-hide">
        <div className="flex p-2 gap-2 w-max">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => {setActiveTabId(cat.id); setIsCalendarView(false);}} 
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${activeTabId === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-orange-400/50' : 'bg-slate-900 text-white/80 border-slate-900 hover:bg-slate-800'}`}>
              <span className="text-orange-400">{getIcon(cat.icon)}</span> {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* TAKVİM GEÇİŞ BUTONU */}
      {activeTabId === 'cat_randevu' && (
        <div className="bg-slate-50 px-4 py-2 flex justify-end border-b border-slate-200">
          <button onClick={() => setIsCalendarView(!isCalendarView)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCalendarView ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}>
            {isCalendarView ? <><CheckSquare size={14}/> Liste Görünümü</> : <><CalendarDays size={14}/> Takvim Görünümü</>}
          </button>
        </div>
      )}

      {/* FİLTRELER */}
      {!isCalendarView && (
        <>
          <div className="bg-slate-100 border-b border-slate-200 overflow-x-auto z-10 scrollbar-hide py-2">
            <div className="flex px-2 gap-2 w-max items-center">
              <MapPin size={14} className="text-slate-400"/>
              <button onClick={() => setActiveCityFilter('all')} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeCityFilter === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-300'}`}>Tümü</button>
              {cities.map(city => (
                <button key={city.id} onClick={() => setActiveCityFilter(city.id)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${activeCityFilter === city.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-300'}`}>
                  {city.title}
                </button>
              ))}
            </div>
          </div>

          {activeTabId !== 'cat_todo' && activeTabId !== 'cat_randevu' && (
            <div className="bg-slate-50 border-b border-slate-200 overflow-x-auto z-10 scrollbar-hide py-2 px-2">
              <div className="flex gap-2 w-max items-center">
                <Wallet size={14} className="text-slate-400 mr-1"/>
                <button onClick={() => setActiveDealType('all')} className={`text-xs px-4 py-1 rounded-md border font-bold transition-all ${activeDealType === 'all' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>Tümü</button>
                <button onClick={() => setActiveDealType('sale')} className={`text-xs px-4 py-1 rounded-md border font-bold transition-all ${activeDealType === 'sale' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-slate-200'}`}>Satılık</button>
                <button onClick={() => setActiveDealType('rent')} className={`text-xs px-4 py-1 rounded-md border font-bold transition-all ${activeDealType === 'rent' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-slate-200'}`}>Kiralık</button>
              </div>
            </div>
          )}

          {showFilters && (
            <div className="bg-slate-100 border-b border-slate-200 p-3 z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-slate-500 text-xs font-bold flex gap-1"><ArrowUpDown size={14}/> Sırala:</div>
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg p-2 flex-1 outline-none">
                  <option value="date_desc">En Yeni</option>
                  <option value="date_asc">En Eski</option>
                  <option value="price_asc">Fiyat (Artan)</option>
                  <option value="price_desc">Fiyat (Azalan)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-slate-500 text-xs font-bold flex gap-1"><Banknote size={14}/> Fiyat:</div>
                <input type="number" placeholder="Min" value={priceFilter.min} onChange={(e)=>setPriceFilter({...priceFilter, min: e.target.value})} className="w-1/3 bg-white border border-slate-300 rounded-lg p-1.5 text-xs"/>
                <input type="number" placeholder="Max" value={priceFilter.max} onChange={(e)=>setPriceFilter({...priceFilter, max: e.target.value})} className="w-1/3 bg-white border border-slate-300 rounded-lg p-1.5 text-xs"/>
              </div>
              <div className="flex gap-2 w-full overflow-x-auto pb-1">
                {availableTags.map(tag => (
                  <button key={tag} onClick={() => toggleFilter(tag)} className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap ${activeFilters.includes(tag) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* İÇERİK ALANI */}
      <div className="flex-1 overflow-y-auto p-4 pb-36 bg-slate-50">
        
        {/* TAKVİM GÖRÜNÜMÜ */}
        {isCalendarView && activeTabId === 'cat_randevu' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft/></button>
              <h3 className="font-bold text-lg text-slate-800">{currentCalendarDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</h3>
              <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(d => <div key={d} className="text-xs font-bold text-slate-400">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentCalendarDate).map((date, i) => {
                if (!date) return <div key={i} className="aspect-square bg-transparent"></div>;
                const dayEvents = categories.find(c => c.id === 'cat_randevu').items.filter(item => {
                  if(!item.alarmTime) return false;
                  const itemDate = new Date(item.alarmTime);
                  return itemDate.getDate() === date.getDate() && itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
                });

                return (
                  <div key={i} className={`aspect-square rounded-lg border text-xs flex flex-col items-center justify-center relative cursor-pointer hover:bg-indigo-50 ${dayEvents.length > 0 ? 'bg-indigo-50 border-indigo-200 font-bold text-indigo-700' : 'bg-white border-slate-100 text-slate-600'}`}
                    onClick={() => setCalendarSelectedDate(date)} 
                  >
                    {date.getDate()}
                    {dayEvents.length > 0 && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1"></div>}
                    <span className="absolute top-0.5 right-0.5 text-slate-300 hover:text-blue-500"><Plus size={10}/></span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* LİSTE GÖRÜNÜMÜ */
          displayItems.length === 0 ? <div className="text-center py-12 opacity-40">Kayıt yok.</div> : (
            <div className="space-y-3">
              {displayItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">#{item.adNo || '---'}</span>
                        {item.cityName && <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5"><MapPin size={10}/>{item.cityName}</span>}
                     </div>
                     {item.price > 0 && (
                       <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100 text-xs font-bold flex items-center gap-1">
                         <Banknote size={12}/>{formatCurrency(item.price)}
                       </div>
                     )}
                  </div>
                  
                  {(item.phone || item.contactName) && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-slate-700">
                      <User size={14} className="text-slate-400"/>
                      <span className="font-bold">{item.contactName || 'İsimsiz'}</span>
                      <span className="text-slate-400">|</span>
                      <Phone size={14} className="text-slate-400"/>
                      <a href={`tel:${item.phone}`} className="text-blue-600 font-mono hover:underline">{item.phone}</a>
                    </div>
                  )}

                  {/* Kiralık/Satılık Etiketi */}
                  <div className="flex gap-2 mb-2">
                    {item.dealType === 'rent' && <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">KİRALIK</span>}
                    {item.dealType === 'sale' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">SATILIK</span>}
                  </div>

                  <p className="text-slate-700 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{item.text}</p>
                  
                  {/* Özellik Etiketleri */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-medium">{tag}</span>
                      ))}
                    </div>
                  )}

                  {item.alarmActive && item.alarmTime && (
                    <div className="mb-2 flex items-center gap-2 bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs border border-yellow-200 w-fit">
                      <Clock size={12}/> {new Date(item.alarmTime).toLocaleString('tr-TR')}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                    <div className="flex gap-2">
                      {item.alarmTime && (
                        <button onClick={() => addToGoogleCalendar(item)} className="p-1.5 rounded-full text-blue-600 bg-blue-50 hover:bg-blue-100" title="Takvime Ekle"><Calendar size={16}/></button>
                      )}
                      <button onClick={() => setEditingItem({originalCatId: activeCategory.id, targetCatId: activeCategory.id, item: {...item}})} className="p-1.5 rounded-full text-slate-300 hover:bg-blue-50 hover:text-blue-500"><Pencil size={16}/></button>
                      <button onClick={() => deleteItem(activeCategory.id, item.id)} className="p-1.5 rounded-full text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* GİRİŞ ALANI */}
      {!isCalendarView && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20">
          {feedbackMsg && <div className="absolute -top-10 left-0 right-0 text-center text-xs font-bold text-white bg-green-600 py-2 shadow-lg animate-bounce">{feedbackMsg}</div>}
          <div className="flex gap-2 items-end">
            <button onClick={handleContactPick} className="bg-slate-900 text-white p-3 rounded-xl mb-1 flex-shrink-0 active:scale-95 shadow-md"><User size={24}/></button>
            <div className="flex-1 relative">
              <textarea 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                onKeyDown={(e) => { 
                  if(e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    processCommand(inputText); 
                  } 
                }}
                placeholder="Yazın veya konuşun..." 
                className="w-full bg-slate-100 rounded-xl p-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-14"
              />
              {inputText && <button onClick={() => processCommand(inputText)} className="absolute right-2 top-2 text-blue-600 bg-white p-1.5 rounded-lg shadow-sm"><Send size={16}/></button>}
            </div>
            <button onClick={startListening} className={`p-4 rounded-xl mb-1 flex-shrink-0 transition-all shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-white active:scale-95'}`}><Mic size={24}/></button>
          </div>
        </div>
      )}

      {/* MODALLAR */}
      {calendarSelectedDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm relative">
            <button onClick={() => setCalendarSelectedDate(null)} className="absolute top-3 right-3 text-slate-400"><X size={20}/></button>
            <h3 className="font-bold text-lg mb-1">{calendarSelectedDate.toLocaleDateString('tr-TR')}</h3>
            <p className="text-xs text-slate-500 mb-4">Bu tarihe randevu ekleyin</p>
            <textarea value={calendarInputText} onChange={(e) => setCalendarInputText(e.target.value)} placeholder="Randevu notu..." className="w-full bg-slate-100 rounded-lg p-3 text-sm h-20 mb-3"/>
            <div className="flex gap-2">
              <button onClick={startListeningCalendar} className={`p-3 rounded-xl flex-shrink-0 transition-all ${isListening ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'}`}><Mic size={20}/></button>
              <button onClick={handleCalendarAdd} className="flex-1 bg-indigo-600 text-white font-bold rounded-xl text-sm">EKLE</button>
            </div>
          </div>
        </div>
      )}
      
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Upload className="text-purple-600"/> Dosya Yükle</h3>
              <button onClick={()=>setShowImportModal(false)}><X/></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Metin (.txt) dosyanızı seçin.</p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Hedef Bölüm</label>
              <select value={importTarget} onChange={(e) => setImportTarget(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-sm">
                <option value="auto">✨ Otomatik (Genel)</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <input type="file" accept=".txt" onChange={handleFileUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
          </div>
        </div>
      )}

      {showCityManagerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm h-3/4 flex flex-col">
            <h3 className="font-bold mb-4 flex items-center gap-2"><MapPin size={18} className="text-orange-500"/> Şehir Yönetimi</h3>
            <div className="mb-4 space-y-2">
              <input value={newCityTitle} onChange={(e)=>setNewCityTitle(e.target.value)} placeholder="Şehir Adı" className="w-full bg-slate-50 border rounded-lg p-2 text-sm"/>
              <textarea value={newCityKeywords} onChange={(e)=>setNewCityKeywords(e.target.value)} placeholder="Mahalleler / Anahtar Kelimeler (Virgülle)" className="w-full bg-slate-50 border rounded-lg p-2 text-sm h-16"/>
              <button onClick={addNewCity} className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-bold">EKLE</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 border-t pt-2">
              {cities.map(city => (
                <div key={city.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">{city.title}</span>
                    <button onClick={()=>removeCity(city.id)} className="text-red-400"><Trash2 size={14}/></button>
                  </div>
                  <p className="text-[10px] text-slate-500">{city.keywords}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCityManagerModal(false)} className="mt-4 bg-slate-200 text-slate-700 py-2 rounded-lg text-sm">Kapat</button>
          </div>
        </div>
      )}

      {/* Edit Item Modal (Taşıma Özelliği Eklendi) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Pencil size={18} className="text-blue-500"/> Kaydı Düzenle
                </h3>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">#{editingItem.item.adNo || '---'}</span>
             </div>
             
             {/* BÖLÜM (KATEGORİ) SEÇİMİ - TAŞIMA İÇİN */}
             <div className="flex items-center border rounded-lg bg-indigo-50 border-indigo-100 mb-2 p-2 gap-2">
               <span className="text-indigo-800 text-xs font-bold w-12">Bölüm:</span>
               <select 
                 value={editingItem.targetCatId} 
                 onChange={(e) => setEditingItem({ ...editingItem, targetCatId: e.target.value })}
                 className="bg-transparent w-full text-sm outline-none text-indigo-900 font-medium"
               >
                 {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
               </select>
               <FolderInput size={16} className="text-indigo-400"/>
             </div>

             {/* ŞEHİR SEÇİMİ */}
             <div className="flex items-center border rounded-lg bg-slate-50 mb-2 p-2 gap-2">
               <span className="text-slate-400 text-xs font-bold w-12">Şehir:</span>
               <select 
                 value={editingItem.item.cityId || ''} 
                 onChange={(e) => {
                    const selectedCity = cities.find(c => c.id === e.target.value);
                    setEditingItem({ ...editingItem, item: { ...editingItem.item, cityId: e.target.value, cityName: selectedCity ? selectedCity.title : '' } })
                 }}
                 className="bg-transparent w-full text-sm outline-none"
               >
                 <option value="">Seçilmedi</option>
                 {cities.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
               </select>
               <MapPin size={16} className="text-slate-400"/>
             </div>

             <div className="flex items-center border rounded-lg bg-slate-50 mb-2 p-2 gap-2">
               <span className="text-slate-400 text-xs font-bold">Fiyat:</span>
               <input type="number" value={editingItem.item.price || ''} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, price: e.target.value } })} className="bg-transparent w-full text-sm outline-none" placeholder="0"/>
             </div>

             <div className="flex items-center border rounded-lg bg-slate-50 mb-2 p-2 gap-2">
               <span className="text-slate-400 text-xs font-bold">Tip:</span>
               <select 
                 value={editingItem.item.dealType || 'sale'} 
                 onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, dealType: e.target.value } })}
                 className="bg-transparent w-full text-sm outline-none"
               >
                 <option value="sale">Satılık</option>
                 <option value="rent">Kiralık</option>
               </select>
             </div>

             <input value={editingItem.item.contactName} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, contactName: e.target.value } })} className="w-full bg-slate-50 border rounded-lg p-2 mb-2 text-sm" placeholder="İsim"/>
             <input value={editingItem.item.phone} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, phone: e.target.value } })} className="w-full bg-slate-50 border rounded-lg p-2 mb-2 text-sm" placeholder="Tel"/>
             <textarea value={editingItem.item.text} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, text: e.target.value } })} className="w-full bg-slate-50 border rounded-lg p-2 mb-3 text-sm h-20"/>
             
             <div className="bg-yellow-50 p-3 rounded-xl border-2 border-yellow-200 mb-4 shadow-sm">
               <div className="flex justify-between items-center mb-2">
                 <label className="text-sm font-bold text-yellow-800 flex items-center gap-1"><Clock size={16}/> Alarm Kur</label>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={editingItem.item.alarmActive} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, alarmActive: e.target.checked } })} className="sr-only peer"/>
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                 </label>
               </div>
               <input type="datetime-local" value={editingItem.item.alarmTime} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, alarmTime: e.target.value, alarmActive: true } })} className="w-full bg-white border border-yellow-300 rounded p-2 text-sm font-medium"/>
               {editingItem.item.alarmTime && (
                 <button onClick={() => addToGoogleCalendar(editingItem.item)} className="mt-2 w-full bg-white border border-blue-200 text-blue-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-50">
                   <Calendar size={14}/> Telefondaki Takvime İşle
                 </button>
               )}
             </div>

             <div className="flex gap-2">
               <button onClick={() => setEditingItem(null)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl text-sm font-bold">İptal</button>
               <button onClick={saveItemChanges} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold">Kaydet</button>
             </div>
          </div>
        </div>
      )}

      {showTagManagerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm h-3/4 flex flex-col">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Tag size={18}/> Etiketleri Düzenle</h3>
            <div className="flex gap-2 mb-4">
              <input value={newTagName} onChange={(e)=>setNewTagName(e.target.value)} placeholder="Yeni etiket" className="flex-1 bg-slate-50 border rounded-lg p-2 text-sm"/>
              <button onClick={()=>{if(newTagName && !availableTags.includes(newTagName)){setAvailableTags([...availableTags,newTagName]);setNewTagName('');}}} className="bg-blue-600 text-white px-3 rounded-lg"><Plus size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 border-t pt-2">
              {availableTags.map(tag => (
                <div key={tag} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                  <span>{tag}</span>
                  <button onClick={()=>setAvailableTags(availableTags.filter(t=>t!==tag))} className="text-red-400"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTagManagerModal(false)} className="mt-4 bg-slate-800 text-white py-2 rounded-lg text-sm">Tamam</button>
          </div>
        </div>
      )}
      
       {showEditCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-bold mb-4"><Pencil size={18}/> Düzenle</h3>
            <input value={editingCategoryData.title} onChange={(e) => setEditingCategoryData({...editingCategoryData, title: e.target.value})} className="w-full bg-slate-50 border rounded-lg p-2 mb-3 text-sm"/>
            <textarea value={editingCategoryData.keywords} onChange={(e) => setEditingCategoryData({...editingCategoryData, keywords: e.target.value})} className="w-full bg-slate-50 border rounded-lg p-2 mb-4 text-sm h-20"/>
            <div className="flex gap-2">
               <button onClick={() => {if(categories.length<=1)return alert("Silinemez"); setCategories(categories.filter(c=>c.id!==editingCategoryData.id)); setShowEditCategoryModal(false);}} className="flex-1 bg-red-50 text-red-500 py-2 rounded-lg text-sm font-bold">SİL</button>
               <button onClick={() => {setCategories(categories.map(c=>c.id===editingCategoryData.id?editingCategoryData:c)); setShowEditCategoryModal(false);}} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">KAYDET</button>
            </div>
            <button onClick={() => setShowEditCategoryModal(false)} className="w-full mt-2 text-slate-400 text-xs py-2">İptal</button>
          </div>
        </div>
      )}
       {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Yeni Bölüm</h3>
            <input placeholder="Bölüm Adı" value={newCatTitle} onChange={(e) => setNewCatTitle(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 mb-3 text-sm"/>
            <textarea placeholder="Anahtar kelimeler" value={newCatKeywords} onChange={(e) => setNewCatKeywords(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 mb-4 text-sm h-20"/>
            <button onClick={() => { if(!newCatTitle) return; setCategories([...categories, {id: `cat_${Date.now()}`, title: newCatTitle, keywords: newCatKeywords, items: [], icon: 'briefcase'}]); setShowAddModal(false); setNewCatTitle(''); setNewCatKeywords(''); }} className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-bold">OLUŞTUR</button>
            <button onClick={() => setShowAddModal(false)} className="w-full mt-2 text-slate-400 text-xs py-2">İptal</button>
          </div>
        </div>
      )}

      {showInstallModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative my-8">
            <button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 text-slate-400"><X/></button>
            <h3 className="text-lg font-bold text-center mb-6">Kurulum</h3>
            <p className="text-sm text-center text-slate-500 mb-4">1. Sağ üst menüden "Ana Ekrana Ekle" deyin.<br/>2. Button Mapper ile ses tuşuna atayın.</p>
            <button onClick={() => setShowInstallModal(false)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Tamam</button>
          </div>
        </div>
      )}
      
      {showManualContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-bold mb-4">Manuel Kişi Ekle</h3>
            <input placeholder="Adı Soyadı" value={manualContactName} onChange={(e) => setManualContactName(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-3 mb-3 text-sm"/>
            <input placeholder="Telefon" type="tel" value={manualContactPhone} onChange={(e) => setManualContactPhone(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-3 mb-4 text-sm"/>
            <button onClick={() => {if(manualContactName) setInputText(`${manualContactName} (${manualContactPhone}) - `); setShowManualContactModal(false); setManualContactName(''); setManualContactPhone('');}} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm">Ekle</button>
            <button onClick={() => setShowManualContactModal(false)} className="w-full mt-2 text-slate-400 text-xs py-2">İptal</button>
          </div>
        </div>
      )}

    </div>
  );
}

// Hata Kalkanı ile Uygulamayı Sarmala (Dışa Aktarım Default Olarak)
export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
