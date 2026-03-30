// scripts/content.js
console.log("FBA Tracker Pro : Content script injecté avec succès.");

/**
 * Fonction pour extraire le prix de la page Amazon
 */
function getAmazonPrice() {
    const priceSelectors = [
        '.a-price .a-offscreen', 
        '#priceblock_ourprice',
        '#corePrice_feature_div .a-offscreen',
        '#corePriceDisplay_desktop_feature_div .a-offscreen'
    ];

    let priceElement = null;

    for (let selector of priceSelectors) {
        priceElement = document.querySelector(selector);
        if (priceElement && priceElement.innerText.trim() !== '') {
            break;
        }
    }
    
    if (priceElement) {
        let rawPrice = priceElement.innerText;
        let cleanPrice = rawPrice.replace(/[^\d,.-]/g, '').replace(',', '.').trim();
        console.log("FBA Tracker : Prix brut trouvé ->", rawPrice, "| Prix nettoyé ->", cleanPrice);
        return parseFloat(cleanPrice);
    }
    
    console.warn("FBA Tracker : Impossible de trouver le prix sur cette page.");
    return null;
}

/**
 * Écouteur de messages venant de l'interface (popup)
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Action 1 : Calcul de marge (Récupérer le prix)
    if (request.action === "getPrice") {
        const price = getAmazonPrice();
        sendResponse({ price: price });
    }
    
    // Action 2 : Espionnage de stock (Attaque 999)
    if (request.action === "checkStock") {
        const addToCartBtn = document.querySelector('#add-to-cart-button');
        const quantitySelect = document.querySelector('select#quantity');
        const quantityInput = document.querySelector('input#quantity');
        const form = document.querySelector('#addToCart');

        if (addToCartBtn && form) {
            console.log("FBA Tracker : Lancement de l'attaque 999...");

            if (quantityInput) {
                quantityInput.value = '999';
            } else if (quantitySelect) {
                let option = document.createElement("option");
                option.value = "999";
                option.text = "999";
                quantitySelect.appendChild(option);
                quantitySelect.value = "999";
            } else {
                let hiddenQty = document.createElement('input');
                hiddenQty.type = 'hidden';
                hiddenQty.name = 'quantity';
                hiddenQty.value = '999';
                form.appendChild(hiddenQty);
            }
            
            addToCartBtn.click();
            sendResponse({ status: "success", message: "Ajout de 999 unités au panier déclenché." });
        } else {
            console.error("FBA Tracker : Bouton d'ajout au panier ou formulaire introuvable.");
            sendResponse({ status: "error", message: "Bouton d'ajout introuvable" });
        }
    }

    // Action 3 : Sourcing (Récupérer le titre pour AliExpress)
    if (request.action === "getTitle") {
        const titleElement = document.querySelector('#productTitle');
        
        if (titleElement) {
            let rawTitle = titleElement.innerText.trim();
            // On ne garde que les 6 premiers mots pour une recherche AliExpress optimisée
            let shortTitle = rawTitle.split(' ').slice(0, 6).join(' ');
            
            console.log("FBA Tracker : Titre raccourci pour la recherche ->", shortTitle);
            sendResponse({ title: shortTitle });
        } else {
            sendResponse({ title: null });
        }
    }
    
    // Indique à Chrome que la réponse peut être asynchrone
    return true; 
});