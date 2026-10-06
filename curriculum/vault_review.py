"""Corrections to the legacy reference library, applied at build time."""
OVERRIDES={
 'Price justification':'Explain the scope and price of [service] at [price] using [deliverables, hours, costs, approved evidence]. Compare actual alternatives. Do not invent ROI or a cost of inaction. Under 100 words.',
 'Service pricing justification doc':'Using [scope, delivery hours, direct costs, verified alternatives], explain the price of [service]. Show the calculation and exclusions. Discuss possible value without claiming a guaranteed return.',
 'Discount/limited offer DM':'Write a short message explaining this actually approved offer [price, eligibility, real start/end date or actual capacity]. If no limit exists, state the standard offer without urgency. Ask one relevant question.',
 'Landing page — bonus section':'Describe these actual included extras [files and purpose] for [product]. Explain how each helps the buyer use the core deliverable. Do not invent dollar values or inflate a value stack.',
 'Landing page — trust signals':'Recommend truthful trust elements for [offer] from [available evidence]: real preview, clear scope, compatible formats, actual support/refund terms, authorized proof, working checkout and seller contact. Never invent badges, logos, counts or media mentions.',
 'Product affiliate program setup':'Design an affiliate-program worksheet for [product] using [price, fees, refund rate, delivery cost, supported platform]. Calculate sustainable commission options, clarify attribution and approval rules, and flag settings requiring official documentation. Do not assume a universal commission range.',
 'Growth channel evaluation':'Compare organic content, paid ads, SEO, partnerships and referrals for [business] with [budget, skills, actual historical data]. Separate assumptions from evidence. Estimate effort with explicit ranges and choose a small experiment. Do not invent expected ROI or time to first sale.',
 'Product launch scalability':'Review [actual sales, sources, costs, time, conversion data] for [product]. Suggest three bounded experiments with budgets, quality checks and stop criteria. Identify delivery/support bottlenecks. Do not promise a sales multiplier or no extra effort.',
 'Multi-channel outreach sequence':'Create a small, respectful outreach plan for [offer] and [researched prospect facts]. Choose an appropriate channel and one relevant follow-up. Do not chase someone across channels after silence or refusal. Include an evidence-based opener and opt-out.',
 'SMS cart recovery':'Draft one cart-recovery reminder for [offer] only for customers who expressly opted into this channel under our actual rules [consent, opt-out, timing]. Use the real link and approved terms. No invented scarcity. Do not send if permission is absent.'
}
def review(p):
 p=dict(p)
 p['t']=OVERRIDES.get(p['title'],p['t'])
 for old,new in [('Voice notes get higher reply rates.','Test the format against your own replies.'),('Video DMs (Loom etc.) drastically outperform text.','Use a short screen demonstration where relevant.'),('price + guarantee','price + actual refund/revision terms'),('CTA (buy now + guarantee)','CTA and actual offer terms'),('final CTA + guarantee','final CTA and actual offer terms'),('a small \'risk-free\' reassurance text','a precise statement of actual terms'),('Make the total bonus value at least 3x the product price.','Describe actual included assets without invented valuations.')]:p['t']=p['t'].replace(old,new)
 if any(x in p['t'].lower() for x in ['urgency','scarcity','limited','guarantee']):p['t']+='\nUse only approved offer terms. Do not invent limits, deadlines, bonuses, refund promises or outcome guarantees.'
 if p['cat']=='email':p['t']+='\nUse this only for recipients who requested or consented to this communication. Include the actual opt-out route and stop after opt-out.'
 return p
