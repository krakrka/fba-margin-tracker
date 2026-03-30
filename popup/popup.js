// popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation des éléments de l'interface
    const ui = {
        calcBtn: document.getElementById('calc-btn'),
        stockBtn: document.getElementById('stock-btn'),
        sourceBtn: document.getElementById('source-btn'), // Le nouveau bouton orange
        displayPrice: document.getElementById('display-price'),
        displayMargin: document.getElementById('display-margin'),
        stockResult: document.getElementById('stock-result'),
        
        // Paramètres de l'utilisateur
        tvaInput: document.getElementById('setting-tva'),
        referralInput: document.getElementById('setting-referral'),
        fbaInput: document.getElementById('setting-fba'),
        costInput: document.getElementById('setting-cost'),
        saveBtn: document.getElementById('save-settings-btn'),
        saveConfirm: document.getElementById('save-confirm')
    };

    // Valeurs par défaut
    const defaultSettings = {
        tvaRate: 20.0,
        referralFee: 15.0,
        fbaFee: 3.50,
        costPct: 25.0
    };

    let currentPrice = 0; 

    /**
     * Charge les paramètres sauvegardés au démarrage
     */
    function loadSettings() {
        chrome.storage.sync.get(defaultSettings, (settings) => {
            ui.tvaInput.value = settings.tvaRate;
            ui.referralInput.value = settings.referralFee;
            ui.fbaInput.value = settings.fbaFee;
            ui.costInput.value = settings.costPct;
        });
    }

    /**
     * Sauvegarde les paramètres modifiés par l'utilisateur
     */
    ui.saveBtn.addEventListener('click', () => {
        const newSettings = {
            tvaRate: parseFloat(ui.tvaInput.value) || 0,
            referralFee: parseFloat(ui.referralInput.value) || 0,
            fbaFee: parseFloat(ui.fbaInput.value) || 0,
            costPct: parseFloat(ui.costInput.value) || 0
        };

        chrome.storage.sync.set(newSettings, () => {
            ui.saveConfirm.textContent = "✔ Sauvegardé";
            setTimeout(() => { ui.saveConfirm.textContent = ""; }, 2000);
            
            if (currentPrice > 0) {
                renderMargin(currentPrice, newSettings);
            }
        });
    });

    /**
     * Moteur de calcul financier
     */
    function calculateFBAMargin(price, settings) {
        const tva = settings.tvaRate / 100;
        const referral = settings.referralFee / 100;
        const cost = settings.costPct / 100;

        let tvaAmount = price - (price / (1 + tva));
        let referralAmount = price * referral;
        let productCostAmount = price * cost;
        
        return price - tvaAmount - referralAmount - settings.fbaFee - productCostAmount;
    }

    /**
     * Met à jour l'affichage de la marge
     */
    function renderMargin(price, settings) {
        currentPrice = price; 
        ui.displayPrice.textContent = price.toFixed(2) + " €";
        
        let margin = calculateFBAMargin(price, settings);
        ui.displayMargin.textContent = margin.toFixed(2) + " €";
        
        ui.displayMargin.style.color = margin > 0 ? "#16a34a" : "#dc2626";
    }

    /**
     * ACTION 1 : Calculer la rentabilité
     */
    ui.calcBtn.addEventListener('click', () => {
        ui.displayPrice.textContent = "Calcul...";
        ui.displayMargin.textContent = "--";

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            let activeTab = tabs[0];
            
            if (!activeTab.url.includes("amazon.")) {
                ui.displayPrice.textContent = "Erreur";
                ui.displayMargin.textContent = "Allez sur Amazon.";
                ui.displayMargin.style.color = "#dc2626";
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, {action: "getPrice"}, (response) => {
                if (chrome.runtime.lastError || !response || !response.price) {
                    ui.displayPrice.textContent = "Prix introuvable";
                    ui.displayMargin.textContent = "--";
                    return;
                }

                chrome.storage.sync.get(defaultSettings, (settings) => {
                    renderMargin(response.price, settings);
                });
            });
        });
    });

    /**
     * ACTION 2 : Espionner le Stock
     */
    ui.stockBtn.addEventListener('click', () => {
        ui.stockResult.textContent = "Injection en cours...";
        ui.stockResult.style.color = "#4b5563";
        ui.stockBtn.disabled = true;

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            let activeTab = tabs[0];
            
            if (!activeTab.url.includes("amazon.")) {
                ui.stockResult.textContent = "Uniquement sur Amazon.";
                ui.stockBtn.disabled = false;
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, {action: "checkStock"}, (response) => {
                ui.stockBtn.disabled = false;
                
                if (chrome.runtime.lastError) {
                    ui.stockResult.textContent = "Erreur de connexion avec la page.";
                    return;
                }

                if (response && response.status === "success") {
                    ui.stockResult.textContent = "✔ Panier mis à jour !";
                    ui.stockResult.style.color = "#16a34a";
                } else {
                    ui.stockResult.textContent = "Bouton d'ajout introuvable.";
                    ui.stockResult.style.color = "#dc2626";
                }
            });
        });
    });

    /**
     * ACTION 3 : Sourcing AliExpress
     */
    ui.sourceBtn.addEventListener('click', () => {
        ui.stockResult.textContent = "Recherche du fournisseur...";
        ui.stockResult.style.color = "#f97316"; // Orange

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            let activeTab = tabs[0];
            
            if (!activeTab.url.includes("amazon.")) {
                ui.stockResult.textContent = "Allez sur une page produit Amazon.";
                ui.stockResult.style.color = "#dc2626";
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, {action: "getTitle"}, (response) => {
                if (chrome.runtime.lastError || !response || !response.title) {
                    ui.stockResult.textContent = "Titre introuvable sur cette page.";
                    ui.stockResult.style.color = "#dc2626";
                    return;
                }

                ui.stockResult.textContent = "✔ Redirection AliExpress !";
                ui.stockResult.style.color = "#16a34a";
                
                let searchQuery = encodeURIComponent(response.title);
                let aliExpressUrl = `https://www.aliexpress.com/wholesale?SearchText=${searchQuery}`;
                
                chrome.tabs.create({ url: aliExpressUrl });
            });
        });
    });

    // Lancement de l'app
    loadSettings();
});