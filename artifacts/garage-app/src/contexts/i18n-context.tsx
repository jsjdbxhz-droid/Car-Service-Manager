import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'ar' | 'en' | 'fr';

interface Translations {
  [key: string]: string;
}

const arTranslations: Translations = {
  // App Shell
  'app.name': 'إدارة الورشة',
  'nav.dashboard': 'لوحة القيادة',
  'nav.records': 'القائمة',
  'nav.invoices': 'الفواتير',
  'nav.owner': 'لوحة الأونر',
  'nav.admin': 'لوحة الأونر',
  'nav.logout': 'تسجيل الخروج',
  'nav.profile': 'الحساب الشخصي',
  'nav.settings': 'الإعدادات',

  // Dashboard
  'dashboard.title': 'لوحة القيادة',
  'dashboard.total_records': 'إجمالي السجلات',
  'dashboard.total_invoices': 'إجمالي الفواتير',
  'dashboard.total_amount': 'المبلغ الإجمالي',
  'dashboard.recent_records': 'أحدث السجلات',

  // Auth & Landing
  'auth.landing_title': 'مرحباً بك في إدارة الورشة',
  'auth.landing_subtitle': 'أنشئ حسابك وابدأ العمل الآن',
  'auth.enter_code': 'أدخل الرمز...',
  'auth.submit': 'دخول',
  'auth.or_login': 'تسجيل الدخول بكودك',
  'auth.register_new': 'إنشاء حساب جديد',
  'auth.username': 'اسم المستخدم',
  'auth.login_code': 'رمز الدخول',
  'auth.login_code_placeholder': 'أدخل رمزك (مثال: A3K9-PX2M)...',
  'auth.register': 'إنشاء حساب',
  'auth.login': 'دخول',
  'auth.your_code': 'رمز الدخول الخاص بك',
  'auth.save_code_warning': 'احفظ هذا الرمز جيداً — ستحتاجه للدخول من أجهزة أخرى',
  'auth.code_copied': 'تم النسخ!',
  'auth.copy_code': 'نسخ الرمز',
  'auth.start_using': 'ابدأ الاستخدام',
  'auth.have_code': 'لديك رمز؟ سجّل الدخول',
  'auth.no_account': 'ليس لديك حساب؟ أنشئ واحداً',
  'auth.secret_access': 'دخول بكود مميز',

  // Records
  'records.title': 'سجلات الزبائن',
  'records.search': 'بحث...',
  'records.add_new': 'إضافة سجل',
  'records.edit': 'تعديل السجل',
  'records.delete': 'حذف',
  'records.save': 'حفظ السجل',
  'records.visit_count': 'زيارة',
  'records.view': 'سجلات',
  'invoices.view': 'فواتير',

  // Invoices
  'invoices.title': 'الفواتير',
  'invoices.search': 'بحث...',
  'invoices.add_new': 'إضافة فاتورة',
  'invoices.edit': 'تعديل الفاتورة',
  'invoices.print': 'طباعة',
  'invoices.pdf': 'تحويل إلى PDF',
  'invoices.save': 'حفظ الفاتورة',

  // Print Invoice
  'invoice.header': 'فاتورة رقم',
  'invoice.date': 'التاريخ',
  'invoice.workshop_name': 'اسم الورشة / الشركة',
  'invoice.customer_info': 'معلومات الزبون',
  'invoice.car_info': 'معلومات السيارة',
  'invoice.details': 'التفاصيل',

  // Fields
  'field.firstName': 'الاسم',
  'field.lastName': 'اللقب',
  'field.breakdownType': 'نوع العطل',
  'field.totalAmount': 'المبلغ الاجمالي',
  'field.amount': 'المبلغ',
  'field.customerNumber': 'رقم الزبون (اختياري)',
  'field.carType': 'نوع السيارة',
  'field.licensePlate': 'رقم اللوحة',
  'field.paymentMethod': 'طريقة الدفع',
  'field.workshopName': 'اسم الورشة',
  'field.date': 'التاريخ',
  'field.visitCount': 'عدد الزيارات',

  // Messages
  'msg.success': 'تمت العملية بنجاح',
  'msg.error': 'حدث خطأ ما',
  'msg.confirm_delete': 'هل أنت متأكد من الحذف؟',
  'msg.empty_state': 'لا توجد بيانات لعرضها',
  'msg.cancel': 'إلغاء',

  // Settings
  'settings.title': 'الإعدادات',
  'settings.account': 'بيانات الحساب',
  'settings.language': 'اللغة',
  'settings.your_code': 'رمز الدخول الخاص بك',
  'settings.code_info': 'استخدم هذا الرمز للدخول من أي جهاز آخر',
  'settings.show_code': 'عرض الرمز',
  'settings.hide_code': 'إخفاء الرمز',
  'settings.role': 'الصلاحية',
  'settings.role_user': 'مستخدم',
  'settings.role_owner': 'أونر',

  // Owner Panel
  'owner.title': 'لوحة الأونر',
  'owner.search_users': 'ابحث عن مستخدم...',
  'owner.enter_as': 'دخول كـ',
  'owner.impersonating': 'أنت تدخل بحساب',
  'owner.exit': 'خروج من الحساب',
  'owner.records': 'سجلات',
  'owner.invoices': 'فواتير',
  'owner.loginCode': 'رمز الدخول',
  'owner.no_users': 'لا يوجد مستخدمون',
  'owner.select_user': 'اختر مستخدماً من القائمة لعرض بياناته',

  // Download
  'download.title': 'تحميل التطبيق',
  'download.subtitle': 'قم بتثبيت التطبيق على جهازك للوصول السريع',
  'download.install_pwa': 'تثبيت التطبيق',
  'download.qr_instruction': 'امسح الرمز الشريطي للتحميل على الهاتف',
};

const enTranslations: Translations = {
  'app.name': 'Garage Manager',
  'nav.dashboard': 'Dashboard',
  'nav.records': 'Records',
  'nav.invoices': 'Invoices',
  'nav.owner': 'Owner Panel',
  'nav.admin': 'Owner Panel',
  'nav.logout': 'Logout',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',

  'dashboard.title': 'Dashboard',
  'dashboard.total_records': 'Total Records',
  'dashboard.total_invoices': 'Total Invoices',
  'dashboard.total_amount': 'Total Amount',
  'dashboard.recent_records': 'Recent Records',

  'auth.landing_title': 'Welcome to Garage Manager',
  'auth.landing_subtitle': 'Create your account and get started',
  'auth.enter_code': 'Enter code...',
  'auth.submit': 'Submit',
  'auth.or_login': 'Login with your code',
  'auth.register_new': 'Create new account',
  'auth.username': 'Username',
  'auth.login_code': 'Login Code',
  'auth.login_code_placeholder': 'Enter your code (e.g. A3K9-PX2M)...',
  'auth.register': 'Create Account',
  'auth.login': 'Login',
  'auth.your_code': 'Your Login Code',
  'auth.save_code_warning': 'Save this code — you\'ll need it to log in from other devices',
  'auth.code_copied': 'Copied!',
  'auth.copy_code': 'Copy Code',
  'auth.start_using': 'Start Using',
  'auth.have_code': 'Have a code? Login',
  'auth.no_account': 'No account? Create one',
  'auth.secret_access': 'Special code access',

  'records.title': 'Customer Records',
  'records.search': 'Search...',
  'records.add_new': 'Add Record',
  'records.edit': 'Edit Record',
  'records.delete': 'Delete',
  'records.save': 'Save Record',
  'records.visit_count': 'visit',
  'records.view': 'Records',
  'invoices.view': 'Invoices',

  'invoices.title': 'Invoices',
  'invoices.search': 'Search...',
  'invoices.add_new': 'Add Invoice',
  'invoices.edit': 'Edit Invoice',
  'invoices.print': 'Print',
  'invoices.pdf': 'Export PDF',
  'invoices.save': 'Save Invoice',

  'invoice.header': 'Invoice No',
  'invoice.date': 'Date',
  'invoice.workshop_name': 'Workshop Name',
  'invoice.customer_info': 'Customer Info',
  'invoice.car_info': 'Car Info',
  'invoice.details': 'Details',

  'field.firstName': 'First Name',
  'field.lastName': 'Last Name',
  'field.breakdownType': 'Breakdown Type',
  'field.totalAmount': 'Total Amount',
  'field.amount': 'Amount',
  'field.customerNumber': 'Customer Number (Optional)',
  'field.carType': 'Car Type',
  'field.licensePlate': 'License Plate',
  'field.paymentMethod': 'Payment Method',
  'field.workshopName': 'Workshop Name',
  'field.date': 'Date',
  'field.visitCount': 'Visit Count',

  'msg.success': 'Operation successful',
  'msg.error': 'Something went wrong',
  'msg.confirm_delete': 'Are you sure you want to delete?',
  'msg.empty_state': 'No data available',
  'msg.cancel': 'Cancel',

  'settings.title': 'Settings',
  'settings.account': 'Account',
  'settings.language': 'Language',
  'settings.your_code': 'Your Login Code',
  'settings.code_info': 'Use this code to login from any other device',
  'settings.show_code': 'Show Code',
  'settings.hide_code': 'Hide Code',
  'settings.role': 'Role',
  'settings.role_user': 'User',
  'settings.role_owner': 'Owner',

  'owner.title': 'Owner Panel',
  'owner.search_users': 'Search users...',
  'owner.enter_as': 'Enter as',
  'owner.impersonating': 'You\'re browsing as',
  'owner.exit': 'Exit Account',
  'owner.records': 'Records',
  'owner.invoices': 'Invoices',
  'owner.loginCode': 'Login Code',
  'owner.no_users': 'No users found',
  'owner.select_user': 'Select a user to view their data',

  'download.title': 'Download App',
  'download.subtitle': 'Install the app on your device for quick access',
  'download.install_pwa': 'Install App',
  'download.qr_instruction': 'Scan QR to download on mobile',
};

const frTranslations: Translations = {
  'app.name': 'Gestion de Garage',
  'nav.dashboard': 'Tableau de bord',
  'nav.records': 'Dossiers',
  'nav.invoices': 'Factures',
  'nav.owner': 'Panneau Propriétaire',
  'nav.admin': 'Panneau Propriétaire',
  'nav.logout': 'Déconnexion',
  'nav.profile': 'Profil',
  'nav.settings': 'Paramètres',

  'dashboard.title': 'Tableau de bord',
  'dashboard.total_records': 'Total Dossiers',
  'dashboard.total_invoices': 'Total Factures',
  'dashboard.total_amount': 'Montant Total',
  'dashboard.recent_records': 'Dossiers Récents',

  'auth.landing_title': 'Bienvenue dans la Gestion de Garage',
  'auth.landing_subtitle': 'Créez votre compte et commencez',
  'auth.enter_code': 'Entrez le code...',
  'auth.submit': 'Soumettre',
  'auth.or_login': 'Connexion avec votre code',
  'auth.register_new': 'Créer un compte',
  'auth.username': 'Nom d\'utilisateur',
  'auth.login_code': 'Code de connexion',
  'auth.login_code_placeholder': 'Entrez votre code (ex: A3K9-PX2M)...',
  'auth.register': 'Créer un compte',
  'auth.login': 'Connexion',
  'auth.your_code': 'Votre code de connexion',
  'auth.save_code_warning': 'Sauvegardez ce code — vous en aurez besoin pour vous connecter depuis d\'autres appareils',
  'auth.code_copied': 'Copié!',
  'auth.copy_code': 'Copier le code',
  'auth.start_using': 'Commencer',
  'auth.have_code': 'Vous avez un code? Connexion',
  'auth.no_account': 'Pas de compte? Créer un',
  'auth.secret_access': 'Accès code spécial',

  'records.title': 'Dossiers Clients',
  'records.search': 'Recherche...',
  'records.add_new': 'Nouveau Dossier',
  'records.edit': 'Modifier Dossier',
  'records.delete': 'Supprimer',
  'records.save': 'Enregistrer',
  'records.visit_count': 'visite',
  'records.view': 'Dossiers',
  'invoices.view': 'Factures',

  'invoices.title': 'Factures',
  'invoices.search': 'Recherche...',
  'invoices.add_new': 'Nouvelle Facture',
  'invoices.edit': 'Modifier Facture',
  'invoices.print': 'Imprimer',
  'invoices.pdf': 'Exporter PDF',
  'invoices.save': 'Enregistrer Facture',

  'invoice.header': 'Facture N°',
  'invoice.date': 'Date',
  'invoice.workshop_name': 'Nom de l\'Atelier',
  'invoice.customer_info': 'Info Client',
  'invoice.car_info': 'Info Voiture',
  'invoice.details': 'Détails',

  'field.firstName': 'Prénom',
  'field.lastName': 'Nom',
  'field.breakdownType': 'Type de Panne',
  'field.totalAmount': 'Montant Total',
  'field.amount': 'Montant',
  'field.customerNumber': 'Numéro Client (Optionnel)',
  'field.carType': 'Type de Voiture',
  'field.licensePlate': 'Plaque d\'Immatriculation',
  'field.paymentMethod': 'Mode de Paiement',
  'field.workshopName': 'Nom de l\'Atelier',
  'field.date': 'Date',
  'field.visitCount': 'Nb Visites',

  'msg.success': 'Opération réussie',
  'msg.error': 'Quelque chose s\'est mal passé',
  'msg.confirm_delete': 'Êtes-vous sûr de vouloir supprimer ?',
  'msg.empty_state': 'Aucune donnée disponible',
  'msg.cancel': 'Annuler',

  'settings.title': 'Paramètres',
  'settings.account': 'Compte',
  'settings.language': 'Langue',
  'settings.your_code': 'Votre code de connexion',
  'settings.code_info': 'Utilisez ce code pour vous connecter depuis un autre appareil',
  'settings.show_code': 'Afficher le code',
  'settings.hide_code': 'Masquer le code',
  'settings.role': 'Rôle',
  'settings.role_user': 'Utilisateur',
  'settings.role_owner': 'Propriétaire',

  'owner.title': 'Panneau Propriétaire',
  'owner.search_users': 'Rechercher un utilisateur...',
  'owner.enter_as': 'Entrer en tant que',
  'owner.impersonating': 'Vous naviguez en tant que',
  'owner.exit': 'Quitter le compte',
  'owner.records': 'Dossiers',
  'owner.invoices': 'Factures',
  'owner.loginCode': 'Code de connexion',
  'owner.no_users': 'Aucun utilisateur',
  'owner.select_user': 'Sélectionnez un utilisateur pour voir ses données',

  'download.title': 'Télécharger l\'Application',
  'download.subtitle': 'Installez l\'application sur votre appareil',
  'download.install_pwa': 'Installer l\'Application',
  'download.qr_instruction': 'Scanner le QR pour télécharger sur mobile',
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('garage_lang') as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('garage_lang', lang);
    setLanguageState(lang);
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    let translations = arTranslations;
    if (language === 'en') translations = enTranslations;
    if (language === 'fr') translations = frTranslations;
    return translations[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) throw new Error('useI18n must be used within an I18nProvider');
  return context;
}
