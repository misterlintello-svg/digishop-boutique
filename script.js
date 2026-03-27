const API_URL = 'http://127.0.0.1:8000';
// ===== COMPTEURS =====
function lancerCompteur(compteur) {
    if (compteur.dataset.counted) return;
    compteur.dataset.counted = true;

    const cible = parseInt(compteur.getAttribute('data-target'));
    const duree = 2000;
    const increment = cible / (duree / 16);
    let valeur = 0;

    const compter = setInterval(() => {
        valeur += increment;
        if (valeur >= cible) {
            compteur.textContent = cible;
            clearInterval(compter);
        } else {
            compteur.textContent = Math.floor(valeur);
        }
    }, 16);
}

const compteurs = document.querySelectorAll('.compteur');
if (compteurs.length > 0) {
    const observateurCompteur = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) lancerCompteur(entry.target);
        });
    }, { threshold: 0.1 });
    compteurs.forEach(c => observateurCompteur.observe(c));

    window.addEventListener('load', () => {
        compteurs.forEach(c => {
            const rect = c.getBoundingClientRect();
            if (rect.top < window.innerHeight) lancerCompteur(c);
        });
    });
}

// ===== FAQ ACCORDION =====
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const reponse = question.nextElementSibling;
        const icone = question.querySelector('i');
        const estOuvert = reponse.classList.contains('actif');

        document.querySelectorAll('.faq-reponse').forEach(r => {
            r.classList.remove('actif');
        });
        document.querySelectorAll('.faq-question i').forEach(i => {
            i.style.transform = 'rotate(0deg)';
        });

        if (!estOuvert) {
            reponse.classList.add('actif');
            icone.style.transform = 'rotate(180deg)';
        }
    });
});

// ===== FILTRES PRODUITS =====
function filtrer(categorie) {
    const produits = document.querySelectorAll('.produit-card');
    const boutons = document.querySelectorAll('.filtre-btn');
    const nbProduits = document.getElementById('nb-produits');

    boutons.forEach(btn => btn.classList.remove('actif'));
    event.target.classList.add('actif');

    let count = 0;
    produits.forEach(produit => {
        const cat = produit.getAttribute('data-categorie');
        if (categorie === 'tous' || cat === categorie) {
            produit.style.display = 'block';
            count++;
        } else {
            produit.style.display = 'none';
        }
    });

    if (nbProduits) {
        nbProduits.textContent = count + ' produit(s) disponible(s)';
    }
}

// ===== PAGE COMMANDE =====
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const produit = params.get('produit');
    const prix = params.get('prix');

    if (produit && prix) {
        const resumeProduit = document.getElementById('resume-produit');
        const resumePrix = document.getElementById('resume-prix');
        const resumeTotal = document.getElementById('resume-total');
        const produitInput = document.getElementById('produit-input');

        if (resumeProduit) resumeProduit.textContent = produit;
        if (resumePrix) resumePrix.textContent = parseInt(prix).toLocaleString() + ' FCFA';
        if (resumeTotal) resumeTotal.textContent = parseInt(prix).toLocaleString() + ' FCFA';
        if (produitInput) produitInput.value = produit;
    }
});

// ===== BOUTON COMMANDER =====
const btnCommander = document.getElementById('btn-commander');
if (btnCommander) {
    btnCommander.addEventListener('click', async () => {
        const nom = document.getElementById('nom').value.trim();
        const prenom = document.getElementById('prenom').value.trim();
        const email = document.getElementById('email').value.trim();
        const whatsapp = document.getElementById('whatsapp').value.trim();
        const produit = document.getElementById('produit-input').value;
        const paiement = document.getElementById('paiement').value;
        const messageTexte = document.getElementById('message').value.trim();
        const erreur = document.getElementById('erreur-commande');

        if (!nom || !prenom || !email || !whatsapp || !paiement) {
            erreur.style.color = 'red';
            erreur.textContent = '❌ Veuillez remplir tous les champs obligatoires.';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const prix = params.get('prix');

        // ENREGISTREMENT DANS POSTGRESQL VIA DJANGO
        try {
            const response = await fetch(`${API_URL}/api/commande/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom, prenom, email, whatsapp,
                    produit, prix: parseInt(prix),
                    paiement, message: messageTexte
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // REDIRECTION VERS WHATSAPP
                const texte = encodeURIComponent(
                    `Bonjour ! Je souhaite commander :\n\n` +
                    `📦 Produit : ${produit}\n` +
                    `💰 Prix : ${parseInt(prix).toLocaleString()} FCFA\n` +
                    `👤 Nom : ${nom} ${prenom}\n` +
                    `📧 Email : ${email}\n` +
                    `📱 WhatsApp : ${whatsapp}\n` +
                    `💳 Paiement : ${paiement}\n\n` +
                    `Merci de confirmer ma commande.`
                );

                const numeroWhatsApp = '2250720443305';
                window.open(`https://wa.me/${numeroWhatsApp}?text=${texte}`, '_blank');
                erreur.style.color = '#25d366';
                erreur.textContent = '✅ Commande enregistrée ! Redirection vers WhatsApp...';

                // VIDER LE FORMULAIRE
                document.getElementById('nom').value = '';
                document.getElementById('prenom').value = '';
                document.getElementById('email').value = '';
                document.getElementById('whatsapp').value = '';
                document.getElementById('paiement').value = '';
                document.getElementById('message').value = '';

            } else {
                erreur.style.color = 'red';
                erreur.textContent = '❌ ' + data.message;
            }

        } catch (error) {
            erreur.style.color = 'red';
            erreur.textContent = '❌ Erreur de connexion au serveur.';
        }
    });
}

// ===== FORMULAIRE CONTACT =====
const btnContact = document.getElementById('btn-contact');
if (btnContact) {
    btnContact.addEventListener('click', async () => {
        const nom = document.getElementById('contact-nom').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const sujet = document.getElementById('contact-sujet').value;
        const message = document.getElementById('contact-message').value.trim();
        const confirmation = document.getElementById('confirmation-contact');

        if (!nom || !email || !sujet || !message) {
            confirmation.style.color = 'red';
            confirmation.textContent = '❌ Veuillez remplir tous les champs.';
            return;
        }

        // ENREGISTREMENT DANS POSTGRESQL VIA DJANGO
        try {
            const response = await fetch(`${API_URL}/api/message/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nom, email, sujet, message })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // REDIRECTION VERS WHATSAPP
                const texte = encodeURIComponent(
                    `Bonjour Apprenant2.0 !\n\n` +
                    `👤 Nom : ${nom}\n` +
                    `📧 Email : ${email}\n` +
                    `📌 Sujet : ${sujet}\n\n` +
                    `💬 Message : ${message}`
                );

                const numeroWhatsApp = '2250720443305';
                window.open(`https://wa.me/${numeroWhatsApp}?text=${texte}`, '_blank');

                confirmation.style.color = '#25d366';
                confirmation.textContent = '✅ Message enregistré et envoyé via WhatsApp !';

                document.getElementById('contact-nom').value = '';
                document.getElementById('contact-email').value = '';
                document.getElementById('contact-sujet').value = '';
                document.getElementById('contact-message').value = '';

            } else {
                confirmation.style.color = 'red';
                confirmation.textContent = '❌ ' + data.message;
            }

        } catch (error) {
            confirmation.style.color = 'red';
            confirmation.textContent = '❌ Erreur de connexion au serveur.';
        }
    });
}

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('nav');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.padding = '10px 60px';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        } else {
            navbar.style.padding = '15px 60px';
            navbar.style.boxShadow = '0 2px 15px rgba(0,0,0,0.2)';
        }
    }
});