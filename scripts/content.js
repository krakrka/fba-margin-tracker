// scripts/content.js
console.log("FBA Tracker Pro : Content script injecté avec succès.");

/**
 * Fonction pour extraire le prix de la page Amazon.
 * Utilise plusieurs sélecteurs de secours (fallbacks) au cas où Amazon modifie son interface.
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
            break; // On arrête la boucle dès qu'on a trouvé un prix valide
        }
    }
    
    if (priceElement) {
        // Nettoyage de la chaîne de caractères (retrait du symbole €, espaces, et conversion de la virgule)
        let rawPrice = priceElement.innerText;
        let cleanPrice = rawPrice.replace(/[^\d,.-]/g, '').replace(',', '.').trim();
        
        console.log("FBA Tracker : Prix brut trouvé ->", rawPrice, "| Prix nettoyé ->", cleanPrice);
        return parseFloat(cleanPrice);
    }
    
    console.warn("FBA Tracker : Impossible de trouver le prix sur cette page.");
    return null;
}

/**
 * Écouteur de messages venant de l'interface (popup.js)
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Action 1 : L'utilisateur demande à calculer la marge
    if (request.action === "getPrice") {
        const price = getAmazonPrice();
        sendResponse({ price: price });
    }
    
    // Action 2 : L'utilisateur déclenche la "Killer Feature" (Espionnage de stock)
    if (request.action === "checkStock") {
        const addToCartBtn = document.querySelector('#add-to-cart-button');
        const quantitySelect = document.querySelector('select#quantity');
        const quantityInput = document.querySelector('input#quantity');
        const form = document.querySelector('#addToCart');

        if (addToCartBtn && form) {
            console.log("FBA Tracker : Lancement de l'attaque 999...");

            // Cas A : Il y a un champ input direct
            if (quantityInput) {
                quantityInput.value = '999';
            } 
            // Cas B : C'est un menu déroulant, on le force
            else if (quantitySelect) {
                let option = document.createElement("option");
                option.value = "999";
                option.text = "999";
                quantitySelect.appendChild(option);
                quantitySelect.value = "999";
            } 
            // Cas C : Amazon masque totalement la quantité, on injecte un champ caché dans le formulaire
            else {
                let hiddenQty = document.createElement('input');
                hiddenQty.type = 'hidden';
                hiddenQty.name = 'quantity';
                hiddenQty.value = '999';
                form.appendChild(hiddenQty);
            }
            
            // On déclenche l'ajout au panier
            addToCartBtn.click();
            sendResponse({ status: "success", message: "Ajout de 999 unités au panier déclenché." });
        } else {
            console.error("FBA Tracker : Bouton d'ajout au panier ou formulaire introuvable.");
            sendResponse({ status: "error", message: "Bouton d'ajout introuvable" });
        }
    }
    
    // Indique à Chrome que la réponse peut être asynchrone (bonne pratique de sécurité)
    return true; 
});