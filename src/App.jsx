import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Send, Plus, Trash2, Download, Settings, 
  X, User, Phone, Edit3, Smartphone, Menu, CheckSquare, Briefcase, Map, Home,
  Calendar, Bell, BellOff, Clock, Tag, Filter, Search, ArrowUpDown, Banknote, FileText,
  Sprout, Flower, MapPin, Key, Store, Wallet, Volume2
} from 'lucide-react';

export default function App() {
  // --- Başlangıç Verileri ---
  const defaultCategories = [
    { id: 'cat_randevu', title: 'Randevular', keywords: 'randevu,görüşme,buluşma,toplantı,yarın,saat', items: [], icon: 'calendar' },
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

  // --- State Yönetimi ---
  const [categories, setCategories] = useState(defaultCategories);
  const [cities, setCities] = useState(defaultCities);
  const [availableTags, setAvailableTags] = useState(defaultTags);
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

  // Modallar
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showManualContactModal, setShowManualContactModal] = useState(false);
  const [showTagManagerModal, setShowTagManagerModal] = useState(false);
  const [showCityManagerModal, setShowCityManagerModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [editingCategoryData, setEditingCategoryData] = useState({ id: '', title: '', keywords: '' });
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatKeywords, setNewCatKeywords] = useState('');
  const [newCityTitle, setNewCityTitle] = useState('');
  const [newCityKeywords, setNewCityKeywords] = useState('');
  const [manualContactName, setManualContactName] = useState('');
  const [manualContactPhone, setManualContactPhone] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Ses
  const alarmSound = useRef(null);

  // --- Yükleme / Kaydetme ---
  useEffect(() => {
    const savedData = localStorage.getItem('pro_assistant_final_v19');
    const savedTags = localStorage.getItem('pro_assistant_tags_v19');
    const savedCities = localStorage.getItem('pro_assistant_cities_v19');
    
    if (savedData) setCategories(JSON.parse(savedData));
    if (savedTags) setAvailableTags(JSON.parse(savedTags));
    if (savedCities) setCities(JSON.parse(savedCities));
    
    // Ses
    alarmSound.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => { localStorage.setItem('pro_assistant_final_v19', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('pro_assistant_tags_v19', JSON.stringify(availableTags)); }, [availableTags]);
  useEffect(() => { localStorage.setItem('pro_assistant_cities_v19', JSON.stringify(cities)); }, [cities]);

  // --- ALARM SİSTEMİ ---
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

  // --- BİLGİ AYIKLAMA ---
  const extractInfo = (text) => {
    const phoneRegex = /(0?5\d{2})[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})|(\d{10,11})/;
    const phoneMatch = text.match(phoneRegex);
    let phone = '';
    if (phoneMatch) phone = phoneMatch[0];

    let price = 0;
    const lowerText = text.toLocaleLowerCase('tr-TR');
    const millionMatch = lowerText.match(/(\d+([.,]\d+)?)\s*milyon/);
    if (millionMatch) {
      price = parseFloat(millionMatch[1].replace(',', '.')) * 1000000;
    } else {
      const thousandMatch = lowerText.match(/(\d+([.,]\d+)?)\s*bin/);
      if (thousandMatch) {
        price = parseFloat(thousandMatch[1].replace(',', '.')) * 1000;
      } else {
        const rawMoneyMatch = lowerText.match(/(\d{1,3}(?:[.,]\d{3})*)\s*(tl|lira)/);
        if (rawMoneyMatch) {
          let cleanNum = rawMoneyMatch[1].replace(/\./g, '').replace(/,/g, '.'); 
          price = parseFloat(cleanNum);
        }
      }
    }
    return { phone, text, price };
  };

  // --- ANA MANTIK ---
  const processCommand = (rawText, specificContact = null) => {
    if (!rawText.trim() && !specificContact) return;
    
    let textToProcess = rawText.replace(/(\d)\s*\+\s*(\d)/g, '$1+$2'); // "1 + 1" -> "1+1"
    
    const now = new Date();
    const fullDate = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}`;
    const timestamp = Date.now();
    const lowerText = textToProcess.toLocaleLowerCase('tr-TR');

    let { phone, text, price } = extractInfo(textToProcess);
    let contactName = '';

    if (specificContact) {
      contactName = specificContact.name;
      if (specificContact.tel) phone = specificContact.tel;
    } 

    let detectedCityId = null;
    let detectedCityName = '';
    for (const city of cities) {
      const cityKeys = city.keywords.split(',').map(k => k.trim().toLocaleLowerCase('tr-TR')).filter(k => k !== '');
      if (cityKeys.some(key => lowerText.includes(key))) {
        detectedCityId = city.id;
        detectedCityName = city.title;
        break; 
      }
    }

    let dealType = 'sale'; 
    if (lowerText.includes('kiralık') || lowerText.includes('kira')) dealType = 'rent'; 
    else if (lowerText.includes('satılık')) dealType = 'sale';

    const detectedTags = availableTags.filter(tag => lowerText.includes(tag.toLocaleLowerCase('tr-TR')));

    const newItem = { 
      id: timestamp, text, phone, contactName, date: fullDate, price,
      alarmTime: '', alarmActive: false, tags: detectedTags,
      cityId: detectedCityId, cityName: detectedCityName, dealType: dealType 
    };

    let targetCategoryId = 'cat_todo';
    let matched = false;
    const priorityOrder = ['cat_devren', 'cat_ticari', 'cat_tarla', 'cat_bahce', 'cat_arsa', 'cat_konut', 'cat_randevu'];
    
    if (lowerText.includes('devren')) { targetCategoryId = 'cat_devren'; matched = true; } 
    else {
        for (const catId of priorityOrder) {
          if (catId === 'cat_devren') continue; 
          const cat = categories.find(c => c.id === catId);
          if (cat) {
            const keys = cat.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k !== '');
            if (keys.some(key => lowerText.includes(key))) {
              targetCategoryId = cat.id;
              matched = true;
              break;
            }
          }
        }
    }
    
    setCategories(prev => prev.map(c => {
      if (c.id === targetCategoryId) { return { ...c, items: [newItem, ...c.items] }; }
      return c;
    }));

    const targetCategory = categories.find(c => c.id === targetCategoryId);
    let feedback = `✅ "${targetCategory?.title}" eklendi.`;
    setFeedbackMsg(feedback);
    setActiveTabId(targetCategoryId);
    if(detectedCityId) setActiveCityFilter(detectedCityId);
    setInputText('');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const getProcessedItems = (items) => {
    let result = [...items];
    if (activeCityFilter !== 'all') { result = result.filter(item => item.cityId === activeCityFilter); }
    if (activeDealType !== 'all' && activeTabId !== 'cat_todo' && activeTabId !== 'cat_randevu') { 
        result = result.filter(item => item.dealType === activeDealType); 
    }
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

  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
  };

  const toggleFilter = (tag) => {
    if (activeFilters.includes(tag)) setActiveFilters(activeFilters.filter(t => t !== tag));
    else setActiveFilters([...activeFilters, tag]);
  };

  const handleContactPick = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
        if (contacts.length) setInputText(`${contacts[0].name[0]} (${contacts[0].tel ? contacts[0].tel[0] : ''}) - `);
      } catch (ex) { setShowManualContactModal(true); }
    } else { setShowManualContactModal(true); }
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

  const downloadAllData = () => {
    let hasData = false;
    let content = "--- EMLAK ASİSTANI TÜM KAYITLAR RAPORU ---\n";
    content += `Oluşturulma Tarihi: ${new Date().toLocaleString()}\n\n`;
    categories.forEach(cat => {
      if(cat.items.length > 0) {
        hasData = true;
        content += `\n=== ${cat.title.toUpperCase()} (${cat.items.length}) ===\n----------------------------------------\n`;
        cat.items.forEach((item, index) => {
          content += `${index + 1}) TARİH: ${item.date} | ${item.cityName || 'Şehir Yok'} | ${item.dealType === 'rent' ? 'KİRALIK' : 'SATILIK'}\n`;
          if(item.contactName) content += `   İSİM: ${item.contactName}\n`;
          if(item.phone) content += `   TEL: ${item.phone}\n`;
          if(item.price) content += `   FİYAT: ${formatCurrency(item.price)}\n`;
          content += `   DETAY: ${item.text}\n\n`;
        });
      }
    });
    if (!hasData) { alert("İndirilecek kayıt bulunamadı."); return; }
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Tum_Kayitlar.txt`;
    document.body.appendChild(element); element.click(); document.body.removeChild(element);
    setShowMenu(false);
  };

  const downloadFilteredData = () => {
    const activeCategory = categories.find(c => c.id === activeTabId) || categories[0];
    const filteredItems = getProcessedItems(activeCategory.items);
    if (filteredItems.length === 0) { alert("Bu görünümde veri yok."); return; }
    let content = `--- ${activeCategory.title.toUpperCase()} RAPORU ---\n\n`;
    filteredItems.forEach((item, index) => {
      content += `${index + 1}) ${item.text}\n------------------\n`;
    });
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Liste.txt`;
    document.body.appendChild(element); element.click(); document.body.removeChild(element);
    setShowMenu(false);
  };

  const activeCategory = categories.find(c => c.id === activeTabId) || categories[0];
  const displayItems = getProcessedItems(activeCategory.items);

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

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* ÜST BAR */}
      <div className="bg-slate-900 text-white p-2 flex justify-between items-center shadow-lg z-30 h-14">
        <div className="flex items-center gap-2" onClick={() => setShowInstallModal(true)}>
          <img src="https://i.hizliresim.com/arpast7.jpeg" alt="Logo" className="w-10 h-10 object-cover shadow-sm rounded-md border border-slate-600"/>
          <div className="flex flex-col justify-center h-full pt-1">
            <h1 className="font-bold text-xs text-orange-400 leading-tight">Talep - Randevu Asistanı</h1>
            <div className="flex items-center gap-2 mt-0">
               <img src="https://i.hizliresim.com/fa4ibjl.png" alt="Icon" className="h-9 w-auto object-contain"/>
               <p className="text-[0.5rem] font-bold text-blue-300 uppercase tracking-wider leading-none">Pro V1</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
           <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-md transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}><Filter size={18} color="white"/></button>
           <button onClick={() => setShowAddModal(true)} className="bg-slate-800 p-1.5 rounded-md hover:bg-slate-700"><Plus size={18} color="white"/></button>
           <button onClick={() => setShowMenu(!showMenu)} className="bg-slate-800 p-1.5 rounded-md hover:bg-slate-700">
             {showMenu ? <X size={18} color="white"/> : <Menu size={18} color="white"/>}
           </button>
        </div>
      </div>

      {/* MENÜ (Düzeltildi: Arka plan beyaz, z-index 100, gölge) */}
      {showMenu && (
        <div className="absolute top-14 right-2 bg-white rounded-xl shadow-2xl border border-slate-300 z-[100] w-64 p-2">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Sistem</div>
          <button onClick={testAlarm} className="w-full text-left px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg flex gap-2 font-bold mb-1 border border-green-200">
            <Volume2 size={16}/> Bildirim ve Sesi Test Et
          </button>
          <div className="h-px bg-slate-100 my-1"></div>
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Veri</div>
          <button onClick={downloadAllData} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 rounded-lg flex gap-2"><Download size={16}/> Tüm Verileri İndir</button>
          <button onClick={downloadFilteredData} className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex gap-2 font-medium"><FileText size={16}/> Şu Anki Listeyi İndir</button>
          <div className="h-px bg-slate-100 my-1"></div>
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Ayarlar</div>
          <button onClick={() => {setShowCityManagerModal(true); setShowMenu(false);}} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg flex gap-2"><MapPin size={16}/> Şehirleri Düzenle</button>
          <button onClick={() => {setEditingCategoryData({...activeCategory}); setShowEditCategoryModal(true); setShowMenu(false);}} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg flex gap-2"><Edit3 size={16}/> Bölümü Düzenle</button>
          <button onClick={() => {setShowTagManagerModal(true); setShowMenu(false);}} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg flex gap-2"><Tag size={16}/> Etiketleri Düzenle</button>
          <div className="h-px bg-slate-100 my-1"></div>
          <button onClick={() => {setShowInstallModal(true); setShowMenu(false);}} className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex gap-2"><Smartphone size={16}/> Kurulum</button>
        </div>
      )}

      {/* KATEGORİLER */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto z-10 scrollbar-hide">
        <div className="flex p-2 gap-2 w-max">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveTabId(cat.id)} 
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${activeTabId === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-orange-400/50' : 'bg-slate-900 text-white/80 border-slate-900 hover:bg-slate-800'}`}>
              <span className="text-orange-400">{getIcon(cat.icon)}</span> {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* ŞEHİR FİLTRELERİ */}
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

      {/* İŞLEM TİPİ FİLTRELERİ (Yapılacaklar ve Randevu'da Gizli) */}
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

      {/* DETAYLI FİLTRELER */}
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

      {/* LİSTE */}
      <div className="flex-1 overflow-y-auto p-4 pb-36 bg-slate-50">
        {displayItems.length === 0 ? (
          <div className="text-center py-12 opacity-40">
            <p>Bu filtrede kayıt yok.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                <div className="flex justify-between items-start mb-3 pb-2 border-b border-dashed border-slate-100">
                   <div className="flex items-center gap-3">
                      {(item.phone || item.contactName) ? (
                        <>
                          <div className="bg-green-100 text-green-600 p-2 rounded-full"><Phone size={16}/></div>
                          <div>
                            {item.contactName && <p className="font-bold text-sm text-slate-900">{item.contactName}</p>}
                            {item.phone && <a href={`tel:${item.phone}`} className="text-blue-500 text-xs font-mono">{item.phone}</a>}
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-400 text-xs italic">İletişim bilgisi yok</div>
                      )}
                   </div>
                   {item.price > 0 && (
                     <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100 text-xs font-bold flex items-center gap-1">
                       <Banknote size={12}/>{formatCurrency(item.price)}
                     </div>
                   )}
                </div>
                
                <div className="flex gap-2 mb-2">
                  {item.cityName && <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold"><MapPin size={10}/> {item.cityName}</span>}
                  {item.dealType === 'rent' && <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">KİRALIK</span>}
                  {item.dealType === 'sale' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">SATILIK</span>}
                </div>

                <p className="text-slate-700 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{item.text}</p>
                
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
                    <button onClick={() => {
                       const newStatus = !item.alarmActive;
                       if(newStatus && !item.alarmTime) return alert("Önce alarm saati kurun.");
                       setCategories(prev => prev.map(c => c.id === activeTabId ? {...c, items: c.items.map(i => i.id===item.id ? {...i, alarmActive: newStatus} : i)} : c));
                    }} className={`p-1.5 rounded-full ${item.alarmActive ? 'bg-yellow-100 text-yellow-600' : 'text-slate-300 hover:bg-slate-100'}`}>
                      {item.alarmActive ? <Bell size={16} fill="currentColor"/> : <BellOff size={16}/>}
                    </button>
                    <button onClick={() => setEditingItem({catId: activeCategory.id, item: {...item}})} className="p-1.5 rounded-full text-slate-300 hover:bg-blue-50 hover:text-blue-500"><Edit3 size={16}/></button>
                    <button onClick={() => setCategories(prev => prev.map(c => c.id === activeTabId ? {...c, items: c.items.filter(i => i.id !== item.id)} : c))} className="p-1.5 rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GİRİŞ ALANI */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20">
        {feedbackMsg && <div className="absolute -top-10 left-0 right-0 text-center text-xs font-bold text-white bg-green-600 py-2 shadow-lg animate-bounce">{feedbackMsg}</div>}
        <div className="flex gap-2 items-end">
          <button onClick={handleContactPick} className="bg-slate-900 text-white p-3 rounded-xl mb-1 flex-shrink-0 active:scale-95 shadow-md"><User size={24}/></button>
          <div className="flex-1 relative">
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Yazın veya konuşun..." className="w-full bg-slate-100 rounded-xl p-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-14"/>
            {inputText && <button onClick={() => processCommand(inputText)} className="absolute right-2 top-2 text-blue-600 bg-white p-1.5 rounded-lg shadow-sm"><Send size={16}/></button>}
          </div>
          <button onClick={startListening} className={`p-4 rounded-xl mb-1 flex-shrink-0 transition-all shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-white active:scale-95'}`}><Mic size={24}/></button>
        </div>
      </div>

      {/* MODALLAR */}
      
      {/* Edit Item Modal (Geliştirilmiş Alarm Bölümü) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
             <h3 className="font-bold mb-4 text-slate-800">Kaydı Düzenle</h3>
             {/* ... Diğer inputlar ... */}
             <input value={editingItem.item.contactName} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, contactName: e.target.value } })} className="w-full bg-slate-50 border rounded-lg p-2 mb-2 text-sm" placeholder="İsim"/>
             <input value={editingItem.item.phone} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, phone: e.target.value } })} className="w-full bg-slate-50 border rounded-lg p-2 mb-2 text-sm" placeholder="Tel"/>
             <div className="flex items-center border rounded-lg bg-slate-50 mb-2 p-2 gap-2">
               <span className="text-slate-400 text-xs font-bold">Fiyat:</span>
               <input type="number" value={editingItem.item.price || ''} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, price: e.target.value } })} className="bg-transparent w-full text-sm outline-none" placeholder="0"/>
             </div>
             
             <div className="flex items-center border rounded-lg bg-slate-50 mb-2 p-2 gap-2">
               <span className="text-slate-400 text-xs font-bold">Şehir:</span>
               <select value={editingItem.item.cityId || ''} onChange={(e) => { const selectedCity = cities.find(c => c.id === e.target.value); setEditingItem({ ...editingItem, item: { ...editingItem.item, cityId: e.target.value, cityName: selectedCity ? selectedCity.title : '' } }) }} className="bg-transparent w-full text-sm outline-none">
                 <option value="">Seçilmedi</option>
                 {cities.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
               </select>
             </div>

             <div className="flex items-center border rounded-lg bg-slate-50 mb-2 p-2 gap-2">
               <span className="text-slate-400 text-xs font-bold">Tip:</span>
               <select value={editingItem.item.dealType || 'sale'} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, dealType: e.target.value } })} className="bg-transparent w-full text-sm outline-none">
                 <option value="sale">Satılık</option>
                 <option value="rent">Kiralık</option>
               </select>
             </div>

             <textarea value={editingItem.item.text} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, text: e.target.value } })} className="w-full bg-slate-50 border rounded-lg p-2 mb-3 text-sm h-20"/>
             
             {/* ALARM BÖLÜMÜ - VURGULU */}
             <div className="bg-yellow-50 p-3 rounded-xl border-2 border-yellow-200 mb-4 shadow-sm">
               <div className="flex justify-between items-center mb-2">
                 <label className="text-sm font-bold text-yellow-800 flex items-center gap-1"><Clock size={16}/> Alarm Kur</label>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={editingItem.item.alarmActive} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, alarmActive: e.target.checked } })} className="sr-only peer"/>
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                 </label>
               </div>
               <input type="datetime-local" value={editingItem.item.alarmTime} onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, alarmTime: e.target.value, alarmActive: true } })} className="w-full bg-white border border-yellow-300 rounded p-2 text-sm font-medium"/>
             </div>

             <div className="flex gap-2">
               <button onClick={() => setEditingItem(null)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl text-sm font-bold">İptal</button>
               <button onClick={() => {
                 setCategories(prev => prev.map(c => c.id === editingItem.catId ? {...c, items: c.items.map(i => i.id === editingItem.item.id ? editingItem.item : i)} : c));
                 setEditingItem(null);
               }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold">Kaydet</button>
             </div>
          </div>
        </div>
      )}

      {/* Şehir Yönetimi */}
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

      {/* Diğer Modallar (Tag Manager, Edit Category, Add Modal, Install Modal, Manual Contact Modal) - Önceki koddan alınabilir, yer tasarrufu için özetlendi. */}
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
            <h3 className="font-bold mb-4"><Edit3 size={18}/> Düzenle</h3>
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

