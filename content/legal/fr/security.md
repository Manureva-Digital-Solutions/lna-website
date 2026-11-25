---
title: "Sécurité"
metaTitle: "Sécurité — LNA par Lemon Tree SAS"
metaDescription: "Comment LNA protège vos documents et les données extraites : chiffrement, isolation par organisation, accès par rôle, traçabilité des exports et hébergement en France."
updated: "Dernière mise à jour : [date de publication]"
slug: "security"
---

LNA est édité par Lemon Tree SAS. Cette page décrit simplement les mesures que nous appliquons aujourd'hui pour protéger les documents que vous importez et les données que LNA en extrait. Nous ne décrivons que des mesures en place. Lorsque cette page évolue, nous mettons à jour la date ci-dessus.

<h2 id="1-notre-approche">1. Notre approche</h2>

Vos documents et les données qui en sont extraites vous appartiennent. Nous les traitons uniquement pour fournir le service d'extraction et d'export. Nos mesures techniques et organisationnelles sont adaptées aux documents que traitent nos clients : devis, tableaux d'amortissement, relevés de charges.

[À CONFIRMER — phrase facultative. LNA-241 : « pas de revendication de certification ». La garder ou la supprimer, mais ne pas la remplacer par une certification :] LNA ne détient pas, à ce jour, de certification de sécurité délivrée par un tiers.

<h2 id="2-hebergement-et-infrastructure">2. Hébergement et infrastructure</h2>

- La plateforme LNA et vos données sont hébergées en France, sur un VPS dans un centre de données OVH. [À CONFIRMER — que le centre de données est Gravelines.]

<h2 id="3-chiffrement">3. Chiffrement</h2>

- **En transit :** les connexions à LNA sont chiffrées en TLS. [À CONFIRMER — preuve (LNA-302), et version minimale de TLS si on souhaite l'indiquer.]
- **Au repos :** les documents et les données extraites sont stockés chiffrés. [À CONFIRMER — preuve (LNA-302) : mécanisme (chiffrement disque/volume ou applicatif), périmètre (base de données, fichiers, sauvegardes) et détenteur des clés.]

<h2 id="4-isolation-des-donnees">4. Isolation des données</h2>

- Les données de chaque client sont isolées au niveau de son organisation et ne sont jamais accessibles aux autres clients. [À CONFIRMER — preuve (LNA-302).]
- [À CONFIRMER — la page Fonctionnalités indique « Isolation des données par utilisateur — chaque membre ne voit que ses propres documents ». Est-ce exact, sachant que les administrateurs gèrent l'équipe ? À garder ou à supprimer.]

<h2 id="5-controle-d-acces-et-authentification">5. Contrôle d'accès et authentification</h2>

- L'accès à la plateforme repose sur une authentification par jetons (JWT).
- Contrôle d'accès par rôle, avec les rôles Administrateur et Membre. Les administrateurs gèrent les membres de l'équipe, les permissions et la facturation.
- [À CONFIRMER — double authentification, SSO, politique de mots de passe, expiration de session. À mentionner seulement s'ils existent.]

<h2 id="6-tracabilite">6. Traçabilité</h2>

- Chaque export est consigné : qui a exporté quoi, et quand.
- [À CONFIRMER — autres événements journalisés et durée de conservation des journaux. L'offre Enterprise mentionne « journaux d'audit étendus et conservation prolongée ».]

<h2 id="7-vos-documents-et-l-ia">7. Vos documents et l'IA</h2>

- Nous n'utilisons pas vos documents ni les données extraites pour entraîner des modèles d'IA. C'est l'engagement de Lemon Tree. Ce n'est pas, aujourd'hui, une phrase que nous pouvons aussi attribuer au fournisseur d'extraction.
- Pour l'extraction, LNA transmet le contenu des documents à **Mistral AI** (Mistral AI, société française, 15 rue des Halles, 75001 Paris), qui agit comme notre sous-traitant ultérieur dans le cadre de son accord de traitement des données (voir section 11).
- Les catégories particulières de données personnelles au sens de l'article 9 du RGPD, y compris les données de santé, ne sont pas acceptées sur LNA et ne sont pas transmises au fournisseur de modèle d'IA. Le Client ne doit pas les importer. Une clause correspondante est proposée pour les Conditions d'utilisation.
- [À CONFIRMER — masquage des données personnelles avant envoi au modèle d'IA (option LNA-163). À mentionner seulement s'il est mis en œuvre.]

<h2 id="8-conservation-et-suppression">8. Conservation et suppression</h2>

- Vous pouvez exporter ou supprimer vos documents et les données extraites à tout moment depuis les paramètres de votre compte.
- Après la suppression d'un compte, nous supprimons vos données sous 30 jours, sauf si la loi exige leur conservation.
- [À CONFIRMER — durée de conservation paramétrable par organisation et délai de grâce de 30 jours pour la suppression d'une organisation. Ce sont des livrables de LNA-302, toujours « To Do » ; à n'annoncer qu'une fois livrés.]

<h2 id="9-sauvegardes-et-continuite">9. Sauvegardes et continuité</h2>

- [À CONFIRMER — existence des sauvegardes, fréquence, lieu de stockage, chiffrement (LNA-302 « backup encryption »), durée de conservation, effet d'une suppression sur les sauvegardes. Aucune source ne les décrit.]

<h2 id="10-personnel-et-acces-aux-donnees">10. Personnel et accès aux données</h2>

- L'équipe LNA travaille depuis Paris (France) et Pondichéry (Inde).
- Des accès aux données clients ont lieu depuis **l'Inde** pour exploiter la plateforme et en assurer le support. Des clauses contractuelles types (décision (UE) 2021/914 de la Commission européenne) **sont en cours de mise en place** avec l'entité indienne qui accède aux données, assorties de contrôles d'accès. Ces CCT **ne sont pas encore signées**.
- [À CONFIRMER — engagements de confidentialité du personnel, accès au strict nécessaire, journalisation des accès administrateur (LNA-323 ouvert).]
- [À CONFIRMER — à garder ou supprimer. La politique de confidentialité mentionne « Audits de sécurité réguliers et évaluations de vulnérabilités ». Aucune source ne confirme leur réalité, leur fréquence ni leur auteur.]

<h2 id="11-sous-traitants-ulterieurs">11. Sous-traitants ultérieurs</h2>

Nous faisons appel à des prestataires (sous-traitants ultérieurs) pour faire fonctionner LNA, dans le cadre de contrats écrits qui leur imposent des obligations de protection des données équivalentes à celles de notre [Accord de traitement des données](/fr/dpa). Nous informons nos clients à l'avance de tout changement envisagé, et ils peuvent s'y opposer. La liste à jour est disponible sur demande à [privacy@lnaflow.com](mailto:privacy@lnaflow.com).

<h2 id="12-signaler-un-probleme-de-securite">12. Signaler un problème de sécurité</h2>

Si vous pensez avoir identifié une vulnérabilité ou un incident de sécurité concernant LNA, écrivez à [À CONFIRMER — adresse, par ex. une boîte security@ dédiée ou privacy@lnaflow.com]. Merci de donner assez de détails pour reproduire le problème, sans accéder aux données d'autres utilisateurs ni les modifier. [À CONFIRMER — engagement de délai de réponse, le cas échéant.]

En cas de violation de données personnelles touchant des données que nous traitons pour votre compte, nous vous informons dans les conditions prévues par notre [Accord de traitement des données](/fr/dpa).

<h2 id="13-contact">13. Contact</h2>

- Sécurité et protection des données : [privacy@lnaflow.com](mailto:privacy@lnaflow.com)
- Demandes générales : [hello@lnaflow.com](mailto:hello@lnaflow.com)
- Les clients Enterprise peuvent demander notre documentation de sécurité complète.

Lemon Tree SAS, société par actions simplifiée au capital de 2 500 €. Siège social : 21 rue du Docteur Fournier, 37000 Tours, France. RCS Tours, SIREN 904 401 882.
