import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { 
  Mic, Send, Plus, Trash2, Download, Upload, X, User, Phone, Pencil, 
  Menu, CheckSquare, Briefcase, Map, Home, Calendar, Bell, Clock, Tag, 
  Filter, ArrowUpDown, Banknote, FileText, Sprout, Flower, MapPin, Key, 
  Store, Wallet, Volume2, LogOut, Loader2, CalendarDays, ChevronLeft, 
  ChevronRight, Lock, AlertTriangle, RefreshCcw, FolderInput, List
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
          <p className="text-sm mb-4 bg-white p-4 rounded border border-red-200 font-mono text-left w-full overflow-auto max-h-40">
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

let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error("Firebase Başlatma Hatası:", e);
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- VARSAYILAN VERİLER ---
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
   
  // Takvim State'leri
  const [isCalendarView, setIsCalendarView] = useState(true); // Varsayılan olarak takvim görünümü açık gelebilir
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null); // Detay gösterilecek tarih
  const [calendarInputText, setCalendarInputText] = useState('');

  // Modallar
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

  // --- KAYIT VE SENKRONİZASYON ---
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

  useEffect(() => {
    const timeout = setTimeout(() => {
        if(loading) {
            setLoading(false);
            if (!user) setErrorMsg("Bağlantı yavaş. Lütfen sayfayı yenileyin.");
        }
    }, 15000);

    if (!auth) { 
      setErrorMsg("Firebase hizmeti başlatılamadı."); 
      setLoading(false); 
      return; 
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && db) {
        const docRef = doc(db, "users", currentUser.uid);
        const unsubscribeData = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            let dbCategories = data.categories || [];
            const mergedCategories = defaultCategories.map(defCat => {
                const foundInDb = dbCategories.find(c => c.id === defCat.id);
                return foundInDb ? { ...defCat, items: foundInDb.items } : defCat;
            });
            const customCategories = dbCategories.filter(dbCat => !defaultCategories.some(defCat => defCat.id === dbCat.id));
            setCategories([...mergedCategories, ...customCategories]);

            const dbCities = data.cities || [];
            const mergedCities = defaultCities.map(defCity => {
               const foundInDb = dbCities.find(c => c.id === defCity.id);
               return foundInDb || defCity;
            });
            const customCities = dbCities.filter(dbCity => !defaultCities.some(defCity => defCity.id === dbCity.id));
            setCities([...mergedCities, ...customCities]);

            const dbTags = data.tags || [];
            const mergedTags = Array.from(new Set([...defaultTags, ...dbTags]));
            setAvailableTags(mergedTags);

            if(data.lastAdNumber) setLastAdNumber(data.lastAdNumber);
          } else {
            saveToCloud(defaultCategories, defaultCities, defaultTags, 1000, currentUser);
          }
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
    } catch(e) { console.error("Ses yüklenemedi", e); }
    
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => {
        unsubscribeAuth();
        clearTimeout(timeout);
    };
  }, []);

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

  const parseDateFromText = (text) => {
    const lower = text.toLocaleLowerCase('tr-TR');
    let targetDate = new Date();
    let found = false;

    if (lower.includes('yarın')) { 
        targetDate.setDate(targetDate.getDate() + 1); found = true; 
    } else if (lower.includes('öbür gün')) { 
        targetDate.setDate(targetDate.getDate() + 2); found = true; 
    }
    
    // Gelişmiş "Cuma", "Haftaya Salı" vb. algılama
    const days = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
    const todayIndex = targetDate.getDay(); 
    for (let i = 0; i < days.length; i++) {
        if (lower.includes(days[i])) {
            let diff = i - todayIndex;
            if (diff <= 0) diff += 7; // Geçmiş günse veya bugünse haftaya at
            
            if (lower.includes('haftaya')) {
                diff += 7; // Ekstra bir hafta ekle
            }
            
            targetDate.setDate(targetDate.getDate() + diff);
            found = true;
            break; 
        }
    }
    
    let hour = 9; let minute = 0;
    if (lower.includes('akşam')) hour = 19;
    else if (lower.includes('sabah')) hour = 9;
    else if (lower.includes('öğlen')) hour = 13;
    else if (lower.includes('ikindi')) hour = 16;
    
    const timeMatch = lower.match(/saat\s*(\d{1,2})(:(\d{2}))?/);
    if (timeMatch) {
        let h = parseInt(timeMatch[1]);
        if (h < 24) {
             if (h < 12 && (lower.includes('akşam') || lower.includes('öğleden sonra'))) h += 12;
             hour = h;
             if (timeMatch[3]) minute = parseInt(timeMatch[3]);
        }
    }
    targetDate.setHours(hour, minute, 0, 0);
    
    if (found) {
        const offset = targetDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(targetDate.getTime() - offset)).toISOString().slice(0, 16);
        return { date: localISOTime, active: true };
    }
    return { date: '', active: false };
  };

  const extractInfo = (text) => {
    const phoneRegex = /(0?5\d{2})[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})|(\d{10,11})/;
    const phoneMatch = text.match(phoneRegex);
    let phone = phoneMatch ? phoneMatch[0] : '';
    let price = 0;
    const millionMatch = text.toLocaleLowerCase('tr-TR').match(/(\d+([.,]\d+)?)\s*milyon/);
    if (millionMatch) price = parseFloat(millionMatch[1].replace(',', '.')) * 1000000;
    return { phone, text, price };
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
    
    let dealType = lowerText.includes('kiralık') ? 'rent' : 'sale';
    const detectedTags = availableTags.filter(tag => lowerText.includes(tag.toLocaleLowerCase('tr-TR')));
    const newAdNo = lastAdNumber + 1;
    
    let alarmTime = '';
    let alarmActive = false;
    
    // Tarih Mantığı: Zorlanmış tarih (takvimden) veya metinden (NLP)
    if (forcedDate) {
        const d = new Date(forcedDate); d.setHours(9, 0, 0, 0); // Takvimden seçilince varsayılan 09:00
        const offset = d.getTimezoneOffset() * 60000;
        alarmTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
        alarmActive = true;
    } else {
        const parsed = parseDateFromText(textToProcess);
        if (parsed.active) {
            alarmTime = parsed.date;
            alarmActive = true;
        }
    }

    const newItem = { id: timestamp, adNo: newAdNo, text: textToProcess, phone, contactName, date: fullDate, price, alarmTime, alarmActive, tags: detectedTags, cityId: detectedCityId, cityName: detectedCityName, dealType };
    
    let targetCategoryId = 'cat_todo';
    if (forcedDate || alarmActive || lowerText.includes('randevu')) { targetCategoryId = 'cat_randevu'; } 
    else if (lowerText.includes('devren')) { targetCategoryId = 'cat_devren'; } 
    else {
        const priorityOrder = ['cat_ticari', 'cat_tarla', 'cat_bahce', 'cat_arsa', 'cat_konut'];
        for (const catId of priorityOrder) {
          const cat = categories.find(c => c.id === catId);
          if (cat && cat.keywords.split(',').some(k => lowerText.includes(k.trim()))) { targetCategoryId = cat.id; break; }
        }
    }

    const newCategories = categories.map(c => { if (c.id === targetCategoryId) { return { ...c, items: [newItem, ...c.items] }; } return c; });
    setCategories(newCategories);
    setLastAdNumber(newAdNo);
    saveToCloud(newCategories, cities, availableTags, newAdNo); 
    
    setFeedbackMsg(`✅ #${newAdNo} Eklendi`);
    setInputText('');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const deleteItem = (catId, itemId) => {
    if(!confirm("Silmek istediğinize emin misiniz?")) return;
    const newCategories = categories.map(c => {
       if (c.id === catId) return {...c, items: c.items.filter(i => i.id !== itemId)};
       return c;
    });
    setCategories(newCategories);
    saveToCloud(newCategories, cities, availableTags, lastAdNumber);
  };

  const saveItemChanges = () => {
    if (!editingItem) return;
    let newCategories = [...categories];
    const { originalCatId, targetCatId, item } = editingItem;
    if (originalCatId === targetCatId) {
      newCategories = newCategories.map(c => {
        if (c.id === originalCatId) return { ...c, items: c.items.map(i => i.id === item.id ? item : i) };
        return c;
      });
    } else {
      newCategories = newCategories.map(c => { if (c.id === originalCatId) return { ...c, items: c.items.filter(i => i.id !== item.id) }; return c; });
      newCategories = newCategories.map(c => { if (c.id === targetCatId) return { ...c, items: [item, ...c.items] }; return c; });
    }
    setCategories(newCategories);
    saveToCloud(newCategories, cities, availableTags, lastAdNumber);
    setEditingItem(null);
  };

  const handleCalendarAdd = () => { 
      if(!calendarInputText) return; 
      processCommand(calendarInputText, null, calendarSelectedDate); 
      setCalendarInputText(''); 
  };
  
  const startListeningCalendar = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Tarayıcı desteklemiyor.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      setCalendarInputText(e.results[0][0].transcript);
    };
    recognition.start();
  };

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

  const getProcessedItems = (items) => {
    if (!items) return []; 
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
        case 'price_asc': return (a.price || 0) - (b.price || 0);
        case 'price_desc': return (b.price || 0) - (a.price || 0);
        default: return b.id - a.id;
      }
    });
    return result;
  };
  
  const handleFileUpload = async (e) => {
    // Basitleştirilmiş dosya yükleme
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
       alert("Dosya içeriği konsola yazıldı (demo)");
       console.log(e.target.result);
    };
    reader.readAsText(file, "UTF-8");
  };

  const downloadAllData = () => {
     alert("İndirme başlatıldı (demo)");
  };
  
  const downloadFilteredData = () => {
     alert("Liste indirildi (demo)");
  }

  const formatCurrency = (amount) => { if (!amount) return ''; return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount); };
  const toggleFilter = (tag) => { if (activeFilters.includes(tag)) setActiveFilters(activeFilters.filter(t => t !== tag)); else setActiveFilters([...activeFilters, tag]); };
  const handleContactPick = async () => { if ('contacts' in navigator && 'ContactsManager' in window) { try { const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false }); if (contacts.length) setInputText(`${contacts[0].name[0]} (${contacts[0].tel ? contacts[0].tel[0] : ''}) - `); } catch (ex) { setShowManualContactModal(true); } } else { setShowManualContactModal(true); } };
  
  const addNewCity = () => { if (!newCityTitle) return; setCities([...cities, { id: `city_${Date.now()}`, title: newCityTitle, keywords: newCityKeywords }]); setNewCityTitle(''); setNewCityKeywords(''); };
  const removeCity = (cityId) => { if(confirm("Silinsin mi?")) setCities(cities.filter(c => c.id !== cityId)); };
  
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 size={32} className="animate-spin text-blue-600"/></div>;
  if (!user) return <div className="h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white"><img src="https://i.hizliresim.com/arpast7.jpeg" className="w-32 h-32 rounded-2xl mb-6"/><h1 className="text-2xl font-bold">Emlak Asistanı</h1><button onClick={handleLogin} className="mt-8 bg-white text-black px-6 py-3 rounded-full font-bold">Google ile Giriş</button></div>;

  const activeCategory = categories.find(c => c.id === activeTabId) || categories[0];
  const displayItems = getProcessedItems(activeCategory.items);
  const calendarDays = getDaysInMonth(currentCalendarDate);

  // --- RENDER ---
  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      {/* ÜST BAR */}
      <div className="bg-slate-900 text-white p-2 flex justify-between items-center shadow-lg z-30 h-14">
        <div className="flex items-center gap-2">
          <img src="https://i.hizliresim.com/arpast7.jpeg" alt="Logo" className="w-10 h-10 object-cover rounded-md border border-slate-600"/>
          <div className="flex flex-col justify-center h-full pt-1">
            <h1 className="font-bold text-xs text-orange-400 leading-tight">Talep - Randevu Asistanı</h1>
            <p className="text-[0.5rem] text-slate-400">Pro V55 (SPLIT FIXED)</p>
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
        <div className="absolute top-14 right-2 bg-white rounded-xl shadow-2xl border border-slate-300 z-[100] w-64 p-2">
          <button onClick={() => setShowImportModal(true)} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Veri Yükle</button>
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 font-bold hover:bg-red-50">Çıkış Yap</button>
        </div>
      )}

      {/* KATEGORİLER */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto z-10 scrollbar-hide">
        <div className="flex p-2 gap-2 w-max">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => {setActiveTabId(cat.id); setIsCalendarView(true);}} 
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${activeTabId === cat.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
              <span className="text-orange-400">{getIcon(cat.icon)}</span> {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* TAKVİM GEÇİŞ BUTONU (SADECE RANDEVUDA) */}
      {activeTabId === 'cat_randevu' && (
        <div className="bg-slate-50 px-4 py-2 flex justify-end border-b border-slate-200">
           <button onClick={() => setIsCalendarView(!isCalendarView)} className="text-xs font-bold text-indigo-600 bg-white border border-indigo-200 px-3 py-1 rounded">
             {isCalendarView ? 'Liste Görünümü' : 'Takvim Görünümü'}
           </button>
        </div>
      )}

      {/* İÇERİK ALANI */}
      <div className="flex-1 overflow-y-auto p-4 pb-36 bg-slate-50">
        
        {/* SPLIT VIEW (BÖLÜNMÜŞ EKRAN) */}
        {isCalendarView && activeTabId === 'cat_randevu' ? (
           <div className="flex flex-col lg:flex-row h-full gap-4">
              {/* SOL PANEL: LİSTE */}
              <div className="w-full lg:w-1/2 h-1/2 lg:h-full overflow-y-auto border rounded-xl p-2 bg-white shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase sticky top-0 bg-white pb-1 border-b">Randevu Listesi</h4>
                  {displayItems.length === 0 ? <p className="text-center text-xs text-slate-400 mt-10">Kayıt Yok</p> : (
                    <div className="space-y-2">
                      {displayItems.map(item => (
                        <div key={item.id} className="border-b pb-2 last:border-0 hover:bg-slate-50 p-2 rounded cursor-pointer" onClick={() => setEditingItem({originalCatId: 'cat_randevu', targetCatId: 'cat_randevu', item: {...item}})}>
                           <div className="flex justify-between items-center mb-1">
                             <span className="font-bold text-xs text-indigo-700">#{item.adNo}</span>
                             <span className="text-[10px] text-slate-400 font-mono">{item.alarmTime ? new Date(item.alarmTime).toLocaleString('tr-TR') : item.date}</span>
                           </div>
                           <p className="text-xs text-slate-700 line-clamp-2">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* SAĞ PANEL: TAKVİM */}
              <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                 {calendarSelectedDate ? (
                    // GÜN DETAYI
                    <div className="flex flex-col h-full p-4">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                           <button onClick={() => setCalendarSelectedDate(null)} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-bold"><ChevronLeft size={16}/> Geri</button>
                           <h3 className="font-bold text-slate-800">{calendarSelectedDate.toLocaleDateString('tr-TR', {day:'numeric', month:'long'})}</h3>
                           <div className="w-8"></div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                           {categories.find(c => c.id === 'cat_randevu').items
                             .filter(item => item.alarmTime && new Date(item.alarmTime).toDateString() === calendarSelectedDate.toDateString())
                             .sort((a,b) => new Date(a.alarmTime) - new Date(b.alarmTime))
                             .map(item => (
                               <div key={item.id} className="flex gap-2 items-start p-2 bg-indigo-50 rounded border border-indigo-100">
                                 <span className="font-bold text-indigo-700 text-xs mt-0.5">{new Date(item.alarmTime).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                                 <div className="flex-1">
                                    <p className="text-xs text-slate-800">{item.text}</p>
                                 </div>
                               </div>
                             ))
                           }
                        </div>
                        <div className="mt-2 pt-2 border-t flex gap-2">
                           <input value={calendarInputText} onChange={(e) => setCalendarInputText(e.target.value)} placeholder="Saat 14:00 Toplantı..." className="flex-1 bg-slate-50 border rounded-lg px-3 py-2 text-xs outline-none"/>
                           <button onClick={handleCalendarAdd} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus size={18}/></button>
                        </div>
                    </div>
                 ) : (
                    // TAKVİM GRID
                    <div className="flex flex-col h-full p-2">
                        <div className="flex justify-between items-center mb-2 flex-shrink-0">
                           <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth()-1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={16}/></button>
                           <h3 className="font-bold text-sm text-slate-800">{currentCalendarDate.toLocaleString('tr-TR', {month:'long', year:'numeric'})}</h3>
                           <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth()+1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={16}/></button>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 text-center mb-1 flex-shrink-0">
                          {['Pt','Sa','Ça','Pe','Cu','Ct','Pa'].map(d => <div key={d} className="font-bold text-slate-400 text-[0.6rem]">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 auto-rows-fr flex-1 overflow-y-auto">
                          {calendarDays.map((date, i) => {
                             if (!date) return <div key={i} className="bg-transparent"></div>;
                             const hasEvent = categories.find(c => c.id === 'cat_randevu').items.some(item => item.alarmTime && new Date(item.alarmTime).toDateString() === date.toDateString());
                             return (
                               <div key={i} onClick={() => setCalendarSelectedDate(date)} className={`h-full min-h-[3rem] rounded border flex flex-col items-center justify-center relative cursor-pointer hover:bg-indigo-50 ${hasEvent ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-white border-slate-100 text-slate-600'}`}>
                                 {date.getDate()}
                                 {hasEvent && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1"></div>}
                               </div>
                             )
                          })}
                        </div>
                    </div>
                 )}
             </div>
           </div>
        ) : (
           // NORMAL LİSTE GÖRÜNÜMÜ
           <div className="space-y-3">
             {displayItems.map(item => (
               <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-orange-600">#{item.adNo}</span>
                     {item.price > 0 && <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">{formatCurrency(item.price)}</span>}
                  </div>
                  <p className="text-slate-700 text-sm mb-2">{item.text}</p>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                     <span>{item.date}</span>
                     <div className="flex gap-2">
                        <button onClick={() => setEditingItem({originalCatId: activeCategory.id, targetCatId: activeCategory.id, item: {...item}})}><Pencil size={16}/></button>
                        <button onClick={() => deleteItem(activeCategory.id, item.id)}><Trash2 size={16}/></button>
                     </div>
                  </div>
               </div>
             ))}
           </div>
        )}
      </div>

      {/* GİRİŞ ALANI (SADECE LİSTE MODUNDA) */}
      {!isCalendarView && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20">
           <div className="flex gap-2 items-end">
              <button onClick={handleContactPick} className="bg-slate-900 text-white p-3 rounded-xl mb-1 flex-shrink-0 active:scale-95 shadow-md"><User size={24}/></button>
              <div className="flex-1 relative">
                <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Yazın veya konuşun..." className="w-full bg-slate-100 rounded-xl p-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-14"/>
                {inputText && <button onClick={() => processCommand(inputText)} className="absolute right-2 top-2 text-blue-600"><Send size={16}/></button>}
              </div>
              <button onClick={startListening} className="p-4 rounded-xl mb-1 bg-slate-800 text-white active:scale-95"><Mic size={24}/></button>
           </div>
        </div>
      )}

      {/* MODALLAR */}
      {showAddModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded-lg">Kategori Ekleme Modalı (Basitleştirildi) <button onClick={() => setShowAddModal(false)}>Kapat</button></div></div>}
      
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
              <h3 className="font-bold mb-4">Düzenle</h3>
              <textarea value={editingItem.item.text} onChange={(e) => setEditingItem({...editingItem, item: {...editingItem.item, text: e.target.value}})} className="w-full border p-2 rounded h-24 mb-4"/>
              <div className="flex gap-2">
                 <button onClick={() => setEditingItem(null)} className="flex-1 bg-gray-200 py-2 rounded">İptal</button>
                 <button onClick={saveItemChanges} className="flex-1 bg-blue-600 text-white py-2 rounded">Kaydet</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
