// popup/popup.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation des éléments du DOM
    const ui = {
        calcBtn: document.getElementById('calc-btn'),
        stockBtn: document.getElementById('stock-btn'),
        displayPrice: document.getElementById('display-price'),
        displayMargin: document.getElementById('display-margin'),
        stockResult: document.getElementById('stock-result'),
        
        // Paramètres
        tvaInput: document.getElementById('setting-tva'),
        referralInput: document.getElementById('setting-referral'),
        fbaInput: document.getElementById('setting-fba'),
        costInput: document.getElementById('setting-cost'),
        saveBtn: document.getElementById('save-settings-btn'),
        saveConfirm: document.getElementById('save-confirm')
    };

    // 2. Valeurs par défaut (si l'utilisateur n'a encore rien sauvegardé)
    const defaultSettings = {
        tvaRate: 20.0,
        referralFee: 15.0,
        fbaFee: 3.50,
        costPct: 25.0
    };

    let currentPrice = 0; // Stocke le prix pour recalculer sans recharger la page

    /**
     * Charge les paramètres depuis le stockage Chrome au démarrage
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
            
            // Si un prix a déjà été scanné, on recalcule immédiatement la marge
            if (currentPrice > 0) {
                renderMargin(currentPrice, newSettings);
            }
        });
    });

    /**
     * Formule de calcul de la marge (Logique métier isolée)
     */
    function calculateFBAMargin(price, settings) {
        // Conversion des pourcentages en décimales (ex: 20% -> 0.20)
        const tva = settings.tvaRate / 100;
        const referral = settings.referralFee / 100;
        const cost = settings.costPct / 100;

        let tvaAmount = price - (price / (1 + tva));
        let referralAmount = price * referral;
        let productCostAmount = price * cost;
        
        return price - tvaAmount - referralAmount - settings.fbaFee - productCostAmount;
    }

    /**
     * Met à jour l'interface visuelle avec les résultats
     */
    function renderMargin(price, settings) {
        currentPrice = price; // Sauvegarde en mémoire
        ui.displayPrice.textContent = price.toFixed(2) + " €";
        
        let margin = calculateFBAMargin(price, settings);
        ui.displayMargin.textContent = margin.toFixed(2) + " €";
        
        // Indicateur visuel de rentabilité
        ui.displayMargin.style.color = margin > 0 ? "#16a34a" : "#dc2626";
    }

    /**
     * Action : Calculer la rentabilité (Bouton Principal)
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

                // Récupération des paramètres actuels avant de calculer
                chrome.storage.sync.get(defaultSettings, (settings) => {
                    renderMargin(response.price, settings);
                });
            });
        });
    });

    /**
     * Action : Espionner le Stock (La Killer Feature)
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
                    ui.stockResult.textContent = "✔ Panier mis à jour (Vérifiez Amazon !)";
                    ui.stockResult.style.color = "#16a34a";
                } else {
                    ui.stockResult.textContent = "Bouton d'ajout introuvable.";
                    ui.stockResult.style.color = "#dc2626";
                }
            });
        });
    });

    // 3. Démarrage
    loadSettings();
});