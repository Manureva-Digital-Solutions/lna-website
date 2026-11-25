---
title: "Security"
metaTitle: "Security — LNA by Lemon Tree SAS"
metaDescription: "How LNA protects your documents and extracted data: encryption, organisation-level isolation, role-based access, audit trail and hosting in France."
updated: "Last updated: [publication date]"
slug: "security"
---

LNA is published by Lemon Tree SAS. This page describes, in plain terms, the measures we currently apply to protect the documents you upload and the data LNA extracts from them. We describe only measures that are in place today. When this page changes, we update the date above.

<h2 id="1-our-approach">1. Our approach</h2>

Your documents and the data extracted from them belong to you. We collect and process them only to provide the extraction and export service. We apply technical and organisational measures proportionate to the type of documents our customers handle, such as quotes, amortisation schedules and service-charge statements.

[TO CONFIRM — optional sentence. LNA-241 says "no certification claims". Keep it or delete it, but don't replace it with a certification:] LNA does not currently hold a third-party security certification.

<h2 id="2-hosting-and-infrastructure">2. Hosting and infrastructure</h2>

- The LNA platform and your data are hosted in France, on a VPS in an OVH data centre. [TO CONFIRM — that the datacentre is Gravelines.]

<h2 id="3-encryption">3. Encryption</h2>

- **In transit:** connections to LNA are encrypted with TLS. [TO CONFIRM — evidence (LNA-302), and the minimum TLS version if you want it stated.]
- **At rest:** documents and extracted data are stored encrypted. [TO CONFIRM — evidence (LNA-302): the mechanism (disk/volume vs. application level), whether it covers the database, file storage and backups, and who holds the keys.]

<h2 id="4-data-isolation">4. Data isolation</h2>

- Each customer's data is isolated at the organisation level, so it is never accessible to other customers. [TO CONFIRM — evidence (LNA-302).]
- [TO CONFIRM — the features page says "Per-user data isolation — each member sees only their own documents". Is this accurate given that Admins manage the team? Keep it or delete it.]

<h2 id="5-access-control-and-authentication">5. Access control and authentication</h2>

- Access to the platform uses token-based authentication (JWT).
- Role-based access control with Admin and Member roles. Admins manage team members, permissions and billing.
- [TO CONFIRM — two-factor authentication, SSO, password policy and session expiry. Mention only if they exist.]

<h2 id="6-audit-trail">6. Audit trail</h2>

- Every export is logged: who exported what, and when.
- [TO CONFIRM — what other events are logged, and for how long. The Enterprise plan mentions "extended audit logs with longer retention".]

<h2 id="7-your-documents-and-ai">7. Your documents and AI</h2>

- We do not use your documents or extracted data to train AI models. This is Lemon Tree's own commitment. It is not, today, a sentence we can also attribute to the extraction provider.
- To extract data, LNA sends document content to **Mistral AI** (Mistral AI, a French company, 15 rue des Halles, 75001 Paris), acting as our sub-processor, under Mistral's data processing addendum (see section 11).
- Special categories of personal data within the meaning of Article 9 GDPR, including health data, are not accepted on LNA and are not sent to the AI model provider. Customers must not upload such data. A corresponding clause is proposed for the Terms of Service.
- [TO CONFIRM — PII redaction before sending to the AI model (LNA-163 option). Mention only if implemented.]

<h2 id="8-retention-and-deletion">8. Retention and deletion</h2>

- You can export or delete your documents and extracted data at any time from your account settings.
- After an account is deleted, we remove your data within 30 days, unless the law requires us to keep it.
- [TO CONFIRM — the per-organisation retention setting and the 30-day grace window for organisation deletion. Both are LNA-302 deliverables, still "To Do"; state them only once shipped.]

<h2 id="9-backups-and-continuity">9. Backups and continuity</h2>

- [TO CONFIRM — whether backups exist, how often they run, where they are stored, whether they are encrypted (LNA-302 "backup encryption"), how long they are kept, and how deletion affects them. No source describes them.]

<h2 id="10-people-and-access-to-data">10. People and access to data</h2>

- The LNA team works from Paris, France and Pondicherry, India.
- Customer data is accessed from **India** for operating and supporting the platform. Standard Contractual Clauses (European Commission Decision (EU) 2021/914) **are being put in place** with the Indian entity that accesses the data, together with access controls. Those SCCs are **not yet signed**.
- [TO CONFIRM — confidentiality undertakings for staff, least-privilege access, and logging of admin access (LNA-323 open).]
- [TO CONFIRM — keep or delete. The privacy page says "Regular security audits and vulnerability assessments". No source confirms that they take place, how often, or who does them.]

<h2 id="11-sub-processors">11. Sub-processors</h2>

We use service providers (sub-processors) to run LNA, under written contracts with data protection obligations equivalent to those in our [Data Processing Agreement](/en/dpa). We inform customers in advance of any intended change to these sub-processors, and customers may object. The current list is available on request at [privacy@lnaflow.com](mailto:privacy@lnaflow.com).

<h2 id="12-reporting-a-security-issue">12. Reporting a security issue</h2>

If you think you have found a vulnerability or a security incident affecting LNA, write to [TO CONFIRM — address, e.g. a dedicated security@ mailbox or privacy@lnaflow.com]. Please give enough detail for us to reproduce the issue, and don't access or change other users' data. [TO CONFIRM — response commitment, if any.]

If a personal data breach affects data we process on your behalf, we will inform you as set out in our [Data Processing Agreement](/en/dpa).

<h2 id="13-contact">13. Contact</h2>

- Security and data protection: [privacy@lnaflow.com](mailto:privacy@lnaflow.com)
- General enquiries: [hello@lnaflow.com](mailto:hello@lnaflow.com)
- Enterprise customers can request our full security documentation.

Lemon Tree SAS, a French simplified joint-stock company (SAS) with share capital of €2,500. Registered office: 21 rue du Docteur Fournier, 37000 Tours, France. RCS Tours, SIREN 904 401 882.
