import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { 
  Mic, Send, Plus, Trash2, Download, Settings, Upload,
  X, User, Phone, Edit3, Smartphone, Menu, CheckSquare, Briefcase, Map, Home,
  Calendar, Bell, BellOff, Clock, Tag, Filter, ArrowUpDown, Banknote, FileText,
  Sprout, Flower, MapPin, Key, Store, Wallet, Volume2, LogOut, Loader2
} from 'lucide-react';

// --- BURAYI KENDİ FIREBASE BİLGİLERİNİZLE DOLDURUN ---
// Firebase konsolundan aldığınız "firebaseConfig" nesnesini buraya yapıştırın.
// Tırnak işaretlerinin içine kendi kodlarınızı yazın.
const firebaseConfig = {
  apiKey: "BURAYA_API_KEY_YAZILACAK",
  authDomain: "BURAYA_AUTH_DOMAIN_YAZILACAK",
  projectId: "BURAYA_PROJECT_ID_YAZILACAK",
  storageBucket: "BURAYA_STORAGE_BUCKET_YAZILACAK",
  messagingSenderId: "BURAYA_SENDER_ID",
  appId: "BURAYA_APP_ID"
};

// --- Uygulama Başlangıcı ---
let app, db, auth;
try {
  // Eğer config doldurulmuşsa başlat, yoksa hata verme (Demo modunda çalışsın)
  if (firebaseConfig.apiKey !== "BURAYA_API_KEY_YAZILACAK") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (e) {
  console.error("Firebase Hatası:", e);
}

export default function App() {
  // --- Kullanıcı Durumu ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configMissing, setConfigMissing] = useState(false);

  // --- Veri Yapısı ---
  const defaultCategories = [
    { id: 'cat_randevu', title: 'Randevular', keywords: 'randevu,görüşme,buluşma,toplantı,yarın,saat,gösterilecek,gösterim', items: [], icon: 'calendar' },
    { id: 'cat_todo', title: 'Yapılacaklar', keywords: 'yapılacak,hatırlat,alınacak,git,gel,ara,sor,gönder,hazırla,not', items: [], icon: 'check' },
    { id: 'cat_konut', title: 'Konut', keywords: 'ev,daire,konut,villa,yalı,rezidans,bina,site,kat,apartman,stüdyo', items: [], icon: 'home' },
    { id: 'cat_ticari', title: 'Ticari', keywords: 'ofis,dükkan,depo,işyeri,plaza,mağaza,fabrika,imalathane,büro', items: [], icon: 'store' },
    { id: 'cat_devren', title: 'Devren', keywords: 'devren,devir,devredilecek,isim hakkı', items: [], icon: 'key' },
    { id: 'cat_arsa', title: 'Arsa', keywords: 'arsa,arazi,parsel,imarlı,yatırım,metrekare,tek tapu,hisseli,ifrazlı', items: [], icon: 'map' },
    { id: 'cat_tarla', title: 'Tarla', keywords: 'tarla,ekim,biçim,sulak,kuru,dönüm,tarım', items: [], icon: 'sprout' },
    { id: 'cat_bahce', title: 'Bahçe', keywords: 'bahçe,meyve,ağaç,fidan,hobi bahçesi,bağ', items: [], icon: 'flower' }
  ];

  // State'ler
  const [categories, setCategories] = useState(defaultCategories);
  const [cities, setCities] = useState([
    { id: 'city_eregli', title: 'Ereğli', keywords: 'ereğli,toros,toros mahallesi,toki,organize' },
    { id: 'city_konya', title: 'Konya', keywords: 'konya,meram,selçuklu,karatay,bosna' },
    { id: 'city_karaman', title: 'Karaman', keywords: 'karaman,ermenek' }
  ]);
  const [availableTags, setAvailableTags] = useState(["1+1", "2+1", "3+1", "Satılık", "Kiralık"]);
  
  // Aktif Seçimler
  const [activeTabId, setActiveTabId] = useState('cat_randevu');
  const [activeCityFilter, setActiveCityFilter] = useState('all'); 
  const [activeDealType, setActiveDealType] = useState('all'); 
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [lastAdNumber, setLastAdNumber] = useState(1000);

  // Modallar (Eski modallar aynen korunuyor)
  const [showMenu, setShowMenu] = useState(false);
  // ... (Diğer modallar basitlik için state içinde tanımlı varsayalım)

  // --- FIREBASE BAĞLANTISI ---
  useEffect(() => {
    // Config kontrolü
    if (!auth) {
      setConfigMissing(true);
      setLoading(false);
      return;
    }

    // 1. Kullanıcı Giriş Kontrolü
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Kullanıcı giriş yaptıysa veriyi dinle
      if (currentUser) {
        // Tüm şirket verisini tek bir dökümanda tutuyoruz: "company/data"
        const docRef = doc(db, "company", "data");
        
        // CANLI DİNLEME (Real-time Listener)
        const unsubscribeData = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCategories(data.categories || defaultCategories);
            setCities(data.cities || cities);
            setAvailableTags(data.tags || availableTags);
            setLastAdNumber(data.lastAdNumber || 1000);
          } else {
            // İlk kez açılıyorsa veritabanını oluştur
            saveToCloud(defaultCategories, cities, availableTags, 1000);
          }
        });
        return () => unsubscribeData();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- BULUTA KAYDETME (Tüm Veri Değişikliklerinde Çalışır) ---
  const saveToCloud = async (newCategories, newCities, newTags, newAdNum) => {
    if (!user || !db) return;
    try {
      await setDoc(doc(db, "company", "data"), {
        categories: newCategories,
        cities: newCities,
        tags: newTags,
        lastAdNumber: newAdNum,
        lastUpdatedBy: user.email,
        lastUpdatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Kayıt hatası:", e);
      setFeedbackMsg("⚠️ İnternet hatası: Kaydedilemedi!");
    }
  };

  // --- GİRİŞ / ÇIKIŞ İŞLEMLERİ ---
  const handleLogin = async () => {
    if(!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      alert("Giriş yapılamadı: " + error.message);
    }
  };

  const handleLogout = () => {
    if(auth) signOut(auth);
  };

  // --- MANTIK MOTORU (Firebase Entegreli) ---
  // (Önceki processCommand ile aynı, sadece en sonunda saveToCloud çağırıyor)
  const processCommand = (rawText) => {
    // ... (Önceki mantık işlemleri: extractInfo, textToProcess vb.)
    // Simülasyon:
    if (!rawText.trim()) return;
    
    const newAdNo = lastAdNumber + 1;
    const newItem = { 
        id: Date.now(), 
        adNo: newAdNo, 
        text: rawText, 
        date: new Date().toLocaleDateString('tr-TR'),
        // ... diğer alanlar
    };

    // Basit bir ekleme örneği (Gerçek mantık V23'teki gibi olacak)
    const newCategories = categories.map(c => {
        if(c.id === 'cat_todo') return {...c, items: [newItem, ...c.items]};
        return c;
    });

    // STATE GÜNCELLE
    setCategories(newCategories);
    setLastAdNumber(newAdNo);
    
    // BULUTA GÖNDER (Kritik Nokta)
    saveToCloud(newCategories, cities, availableTags, newAdNo);
    
    setFeedbackMsg("✅ Buluta Kaydedildi!");
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // --- EKRAN TASARIMI ---

  // 1. EĞER CONFIG EKSİKSE (Uyarı Ekranı)
  if (configMissing) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center">
        <Settings size={48} className="text-orange-500 mb-4"/>
        <h1 className="text-2xl font-bold mb-2">Kurulum Gerekli</h1>
        <p className="text-sm text-slate-300 mb-6">
          Bu uygulamanın çalışması için <strong>Firebase</strong> ayarlarının yapılması gerekiyor.
        </p>
        <div className="bg-slate-800 p-4 rounded-lg text-left text-xs font-mono text-green-400 w-full mb-4 overflow-x-auto">
          const firebaseConfig = &#123;<br/>
          &nbsp;&nbsp;apiKey: "...",<br/>
          &nbsp;&nbsp;...<br/>
          &#125;
        </div>
        <p className="text-xs text-slate-400">
          GitHub'daki <code>App.jsx</code> dosyasını açın ve en üstteki <strong>firebaseConfig</strong> bölümünü kendi bilgilerinizle doldurun.
        </p>
      </div>
    );
  }

  // 2. YÜKLENİYORSA
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-blue-600"/>
      </div>
    );
  }

  // 3. GİRİŞ EKRANI (Login)
  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <img src="https://i.hizliresim.com/arpast7.jpeg" alt="Logo" className="w-32 h-32 rounded-2xl shadow-2xl mb-6"/>
        <h1 className="text-2xl font-bold mb-1">Emlak Asistanı Pro</h1>
        <p className="text-blue-300 text-sm mb-8 font-bold tracking-widest">CLOUD V24</p>
        
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm w-full max-w-sm border border-white/10">
          <p className="text-center text-sm mb-6 text-slate-300">
            Verilerinize her yerden erişmek ve ekibinizle ortak çalışmak için giriş yapın.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-lg"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5"/>
            Google ile Giriş Yap
          </button>
        </div>
        <p className="mt-8 text-[10px] text-slate-500">Güvenli Veri Altyapısı: Google Firebase</p>
      </div>
    );
  }

  // 4. ANA UYGULAMA (Giriş Yapıldıysa)
  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* ÜST BAR (Profil Eklendi) */}
      <div className="bg-slate-900 text-white p-2 flex justify-between items-center shadow-lg z-30 h-14">
        <div className="flex items-center gap-2">
          <img src="https://i.hizliresim.com/arpast7.jpeg" alt="Logo" className="w-10 h-10 object-cover rounded-md border border-slate-600"/>
          <div className="flex flex-col justify-center h-full pt-1">
            <h1 className="font-bold text-xs text-orange-400 leading-tight">Emlak Asistanı</h1>
            <div className="flex items-center gap-1">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <p className="text-[0.5rem] font-bold text-slate-400 uppercase">Online</p>
            </div>
          </div>
        </div>
        
        {/* Kullanıcı Profili ve Menü */}
        <div className="flex items-center gap-2">
           <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border-2 border-slate-600"/>
           <button onClick={() => setShowMenu(!showMenu)} className="bg-slate-800 p-1.5 rounded-md hover:bg-slate-700">
             {showMenu ? <X size={18} color="white"/> : <Menu size={18} color="white"/>}
           </button>
        </div>
      </div>

      {/* MENÜ (Çıkış Butonu Eklendi) */}
      {showMenu && (
        <div className="absolute top-14 right-2 bg-white rounded-xl shadow-2xl border border-slate-300 z-[100] w-64 p-2 animate-in slide-in-from-top-2">
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <p className="text-xs font-bold text-slate-800">{user.displayName}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
          {/* ... Diğer Menü Öğeleri ... */}
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex gap-2 font-bold"><LogOut size={16}/> Çıkış Yap</button>
        </div>
      )}

      {/* ... KATEGORİLER, LİSTE VE DİĞER HER ŞEY AYNI ... */}
      {/* Burada V23'teki render kodlarının aynısı olacak, sadece veri kaynağı artık state'den geliyor ve o state Firebase'den besleniyor. */}
      
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <p>Veriler Buluttan Yükleniyor...</p>
        {/* Not: Gerçek uygulamada buraya V23'teki liste kodlarını yapıştıracaksınız */}
      </div>

      {/* GİRİŞ ALANI (Buluta Kaydetme Fonksiyonunu Kullanır) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20">
        {feedbackMsg && <div className="absolute -top-10 left-0 right-0 text-center text-xs font-bold text-white bg-green-600 py-2 shadow-lg animate-bounce">{feedbackMsg}</div>}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Buluta kaydetmek için yazın..." className="w-full bg-slate-100 rounded-xl p-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-14"/>
            {inputText && <button onClick={() => processCommand(inputText)} className="absolute right-2 top-2 text-blue-600 bg-white p-1.5 rounded-lg shadow-sm"><Send size={16}/></button>}
          </div>
        </div>
      </div>

    </div>
  );
}
const firebaseConfig = {
  apiKey: "AIzaSyD6ZVlcJYZPfJ5RQEWZGnrh4sBmwHS9_2U",
  authDomain: "randevular-talepler.firebaseapp.com",
  projectId: "randevular-talepler",
  storageBucket: "randevular-talepler.firebasestorage.app",
  messagingSenderId: "313283650196",
  appId: "1:313283650196:web:8052099b467fc25fb88a81"
};
