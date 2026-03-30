// scripts/content.js
console.log("Tracker Pro : Content script injecté.");

function getAmazonPrice() {
    const priceSelectors = ['.a-price .a-offscreen', '#priceblock_ourprice', '#corePrice_feature_div .a-offscreen'];
    for (let selector of priceSelectors) {
        let el = document.querySelector(selector);
        if (el && el.innerText.trim() !== '') {
            return parseFloat(el.innerText.replace(/[^\d,.-]/g, '').replace(',', '.'));
        }
    }
    return null;
}

// NOUVEAU : Fonction pour extraire le Classement Amazon (BSR)
function getAmazonBSR() {
    try {
        // Amazon met souvent le classement dans un tableau spécifique
        let ths = document.querySelectorAll('th');
        for (let th of ths) {
            if (th.innerText.includes('Classement') || th.innerText.includes('Best Sellers Rank')) {
                let td = th.nextElementSibling;
                if (td) return td.innerText.split('(')[0].replace(/[\n\r]/g, '').trim();
            }
        }
        
        // Plan B : Les listes à puces "Détails du produit"
        let divRank = document.querySelector('#detailBullets_feature_div');
        if (divRank && divRank.innerText.includes('#')) {
            let match = divRank.innerText.match(/#[\d\s,]+[^\n]+/);
            if (match) return match[0].split('(')[0].trim();
        }
    } catch (e) {
        console.error("Tracker Pro : Erreur extraction BSR", e);
    }
    return "Non trouvé";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.action === "getData") {
        sendResponse({ 
            price: getAmazonPrice(),
            bsr: getAmazonBSR() // On renvoie le prix ET le classement
        });
    }
    
    if (request.action === "checkStock") {
        const btn = document.querySelector('#add-to-cart-button');
        const form = document.querySelector('#addToCart');
        if (btn && form) {
            let hiddenQty = document.createElement('input');
            hiddenQty.type = 'hidden'; hiddenQty.name = 'quantity'; hiddenQty.value = '999';
            form.appendChild(hiddenQty);
            btn.click();
            sendResponse({ status: "success" });
        } else {
            sendResponse({ status: "error" });
        }
    }

    if (request.action === "getTitle") {
        let el = document.querySelector('#productTitle');
        if (el) sendResponse({ title: el.innerText.trim().split(' ').slice(0, 6).join(' ') });
        else sendResponse({ title: null });
    }
    
    return true; 
});