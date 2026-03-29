# fba-margin-tracker
# 📦 Amazon FBA Margin & Stock Tracker (Chrome Extension)

A lightweight, high-performance Chrome Extension built for Amazon FBA Sellers and Dropshippers. It instantly calculates real net margins and ethically spies on competitors' stock levels using the "999 cart method".

## ✨ Features
* **Real-Time Margin Calculator:** Automatically scrapes the buy-box price and calculates the net margin.
* **Customizable Variables:** Users can save their own local VAT (TVA), Amazon referral fees, fixed FBA fees, and product costs via `chrome.storage.sync`.
* **The "999" Stock Spy:** Injects a secure script to force an add-to-cart of 999 units, revealing the exact inventory of any competitor without triggering Amazon's bot detection.
* **Manifest V3 Ready:** Built with the latest, most secure Chrome Extension standards.

## 🛠 Tech Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (No heavy frameworks, ultra-fast load time).
* **Architecture:** Manifest V3, Content Scripts, Chrome Storage API.
* **Permissions:** Restricted to Amazon domains only (`activeTab`, `scripting`, `storage`) for maximum user privacy and easy Chrome Web Store approval.

## 🚀 How to Install (Developer Mode)
1. Download or clone this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select this project folder.
5. Go to any Amazon product page and click the extension icon to start analyzing.

## 💼 Monetization & Transferability (For Buyers)
This project is structured as a Micro-SaaS. It is fully ready to be integrated with a license key system (like Gumroad, Stripe, or Keygen.sh). The business logic is cleanly isolated in `popup.js`, making it incredibly easy for a new owner to add a paywall, rebrand the UI, and publish it to the Chrome Web Store to generate recurring revenue.