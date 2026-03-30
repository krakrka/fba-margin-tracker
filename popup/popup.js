// popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
    // === DICTIONNAIRE DE LANGUES ===
    const i18n = {
        fr: {
            title_main: "🚀 Tracker Pro", tab_fba: "📦 Amazon FBA", tab_ds: "🌐 Shopify Dropshipping",
            label_tva: "TVA (%)", label_ref: "Com. Amazon (%)", label_fba_fee: "Frais FBA",
            label_cpa: "CPA (Pub FB/TikTok)", label_stripe: "Frais Stripe/PayPal (%)", label_ship: "Livraison Chine",
            label_cost: "Coût Produit Usine (%)", btn_save: "💾 Sauvegarder", text_price: "Prix de vente :",
            text_bsr: "Classement (BSR) :", text_margin: "Marge Nette :", btn_calc: "📊 Calculer la rentabilité",
            btn_stock: "🕵️ Espionner le Stock (999)", btn_source: "🛒 Trouver le fournisseur",
            // Messages dynamiques
            msg_saved: "✔ Sauvegardé", msg_calc: "Calcul...", msg_err_url: "Allez sur Amazon.",
            msg_err_price: "Prix introuvable", msg_not_found: "Non trouvé", msg_inject: "Injection...",
            msg_stock_ok: "✔ Panier mis à jour !", msg_stock_err: "Bouton introuvable.",
            msg_search: "Recherche...", msg_redirect: "✔ Redirection AliExpress !", msg_err_title: "Titre introuvable."
        },
        en: {
            title_main: "🚀 Tracker Pro", tab_fba: "📦 Amazon FBA", tab_ds: "🌐 Shopify Dropshipping",
            label_tva: "VAT (%)", label_ref: "Amazon Fee (%)", label_fba_fee: "FBA Fee",
            label_cpa: "CPA (FB/TikTok Ads)", label_stripe: "Stripe/PayPal Fee (%)", label_ship: "China Shipping",
            label_cost: "Factory Product Cost (%)", btn_save: "💾 Save Settings", text_price: "Selling Price:",
            text_bsr: "Best Sellers Rank:", text_margin: "Net Margin:", btn_calc: "📊 Calculate Profit",
            btn_stock: "🕵️ Spy on Stock (999)", btn_source: "🛒 Find Supplier",
            // Dynamic messages
            msg_saved: "✔ Saved", msg_calc: "Calculating...", msg_err_url: "Go to Amazon.",
            msg_err_price: "Price not found", msg_not_found: "Not found", msg_inject: "Injecting...",
            msg_stock_ok: "✔ Cart updated!", msg_stock_err: "Button not found.",
            msg_search: "Searching...", msg_redirect: "✔ AliExpress Redirect!", msg_err_title: "Title not found."
        }
    };

    let currentMode = 'FBA';
    let currentData = { price: 0, bsr: '' };
    let currentLang = 'fr'; // Langue par défaut

    const ui = {
        langSelect: document.getElementById('lang-selector'),
        calcBtn: document.getElementById('calc-btn'),
        displayPrice: document.getElementById('display-price'),
        displayBsr: document.getElementById('display-bsr'),
        displayMargin: document.getElementById('display-margin'),
        stockResult: document.getElementById('stock-result'),
        
        tabFba: document.getElementById('tab-fba'), tabDs: document.getElementById('tab-ds'),
        settingsFba: document.getElementById('settings-fba'), settingsDs: document.getElementById('settings-ds'),
        
        tvaFba: document.getElementById('setting-tva'), refFba: document.getElementById('setting-referral'), feeFba: document.getElementById('setting-fba'),
        tvaDs: document.getElementById('setting-ds-tva'), cpaDs: document.getElementById('setting-ds-cpa'), stripeDs: document.getElementById('setting-ds-stripe'), shipDs: document.getElementById('setting-ds-shipping'),
        costPct: document.getElementById('setting-cost'), saveBtn: document.getElementById('save-settings-btn'), saveConfirm: document.getElementById('save-confirm')
    };

    const defaultSettings = {
        fba_tva: 20.0, fba_ref: 15.0, fba_fee: 3.50,
        ds_tva: 20.0, ds_cpa: 10.0, ds_stripe: 2.9, ds_ship: 5.0,
        costPct: 25.0, userLang: 'fr'
    };

    // === GESTION DE LA LANGUE ===
    function applyLanguage(lang) {
        currentLang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18n[lang][key]) el.textContent = i18n[lang][key];
        });
        ui.langSelect.value = lang;
        if(currentData.price > 0) renderResults();
    }

    ui.langSelect.addEventListener('change', (e) => {
        applyLanguage(e.target.value);
        chrome.storage.sync.set({ userLang: e.target.value });
    });

    // === GESTION DES ONGLETS ===
    ui.tabFba.addEventListener('click', () => {
        currentMode = 'FBA'; ui.tabFba.classList.add('active'); ui.tabDs.classList.remove('active');
        ui.settingsFba.style.display = 'block'; ui.settingsDs.style.display = 'none';
        if(currentData.price > 0) renderResults();
    });

    ui.tabDs.addEventListener('click', () => {
        currentMode = 'DS'; ui.tabDs.classList.add('active'); ui.tabFba.classList.remove('active');
        ui.settingsDs.style.display = 'block'; ui.settingsFba.style.display = 'none';
        if(currentData.price > 0) renderResults();
    });

    // === SAUVEGARDE & CHARGEMENT ===
    function loadSettings() {
        chrome.storage.sync.get(defaultSettings, (s) => {
            ui.tvaFba.value = s.fba_tva; ui.refFba.value = s.fba_ref; ui.feeFba.value = s.fba_fee;
            ui.tvaDs.value = s.ds_tva; ui.cpaDs.value = s.ds_cpa; ui.stripeDs.value = s.ds_stripe; ui.shipDs.value = s.ds_ship;
            ui.costPct.value = s.costPct;
            applyLanguage(s.userLang);
        });
    }

    ui.saveBtn.addEventListener('click', () => {
        chrome.storage.sync.set({
            fba_tva: parseFloat(ui.tvaFba.value) || 0, fba_ref: parseFloat(ui.refFba.value) || 0, fba_fee: parseFloat(ui.feeFba.value) || 0,
            ds_tva: parseFloat(ui.tvaDs.value) || 0, ds_cpa: parseFloat(ui.cpaDs.value) || 0, ds_stripe: parseFloat(ui.stripeDs.value) || 0, ds_ship: parseFloat(ui.shipDs.value) || 0,
            costPct: parseFloat(ui.costPct.value) || 0, userLang: currentLang
        }, () => {
            ui.saveConfirm.textContent = i18n[currentLang].msg_saved;
            setTimeout(() => { ui.saveConfirm.textContent = ""; }, 2000);
            if(currentData.price > 0) renderResults();
        });
    });

    // === MOTEUR DE CALCUL ===
    function renderResults() {
        chrome.storage.sync.get(defaultSettings, (s) => {
            ui.displayPrice.textContent = currentData.price.toFixed(2);
            ui.displayBsr.textContent = currentData.bsr || i18n[currentLang].msg_not_found;
            
            let price = currentData.price;
            let costAmount = price * (s.costPct / 100);
            let margin = 0;

            if (currentMode === 'FBA') {
                let tvaAmount = price - (price / (1 + (s.fba_tva / 100)));
                let refAmount = price * (s.fba_ref / 100);
                margin = price - tvaAmount - refAmount - s.fba_fee - costAmount;
            } else {
                let tvaAmount = price - (price / (1 + (s.ds_tva / 100)));
                let stripeAmount = price * (s.ds_stripe / 100) + 0.30;
                margin = price - tvaAmount - stripeAmount - s.ds_cpa - s.ds_ship - costAmount;
            }

            ui.displayMargin.textContent = margin.toFixed(2);
            ui.displayMargin.style.color = margin > 0 ? "#16a34a" : "#dc2626";
        });
    }

    // === ACTIONS PRINCIPALES ===
    ui.calcBtn.addEventListener('click', () => {
        ui.displayPrice.textContent = i18n[currentLang].msg_calc; ui.displayMargin.textContent = "--"; ui.displayBsr.textContent = "--";
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs[0].url.includes("amazon.")) {
                ui.displayPrice.textContent = i18n[currentLang].msg_err_url; ui.displayPrice.style.color = "#dc2626"; return;
            }
            ui.displayPrice.style.color = "#374151";
            chrome.tabs.sendMessage(tabs[0].id, {action: "getData"}, (response) => {
                if (response && response.price) {
                    currentData = { price: response.price, bsr: response.bsr }; renderResults();
                } else {
                    ui.displayPrice.textContent = i18n[currentLang].msg_err_price;
                }
            });
        });
    });

    document.getElementById('stock-btn').addEventListener('click', () => {
        ui.stockResult.textContent = i18n[currentLang].msg_inject; ui.stockResult.style.color = "#4b5563";
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs[0].url.includes("amazon.")) return;
            chrome.tabs.sendMessage(tabs[0].id, {action: "checkStock"}, (res) => {
                if(res && res.status === "success"){ ui.stockResult.textContent = i18n[currentLang].msg_stock_ok; ui.stockResult.style.color = "#16a34a"; }
                else { ui.stockResult.textContent = i18n[currentLang].msg_stock_err; ui.stockResult.style.color = "#dc2626"; }
            });
        });
    });

    document.getElementById('source-btn').addEventListener('click', () => {
        ui.stockResult.textContent = i18n[currentLang].msg_search; ui.stockResult.style.color = "#f97316";
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs[0].url.includes("amazon.")) return;
            chrome.tabs.sendMessage(tabs[0].id, {action: "getTitle"}, (response) => {
                if (response && response.title) {
                    ui.stockResult.textContent = i18n[currentLang].msg_redirect; ui.stockResult.style.color = "#16a34a";
                    chrome.tabs.create({ url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(response.title)}` });
                } else {
                    ui.stockResult.textContent = i18n[currentLang].msg_err_title; ui.stockResult.style.color = "#dc2626";
                }
            });
        });
    });

    loadSettings();
});