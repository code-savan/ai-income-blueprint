from pathlib import Path
import csv
from layout import ROOT,E,hero,write
from guides import recipe,prompt,choice_options,context_selector
from curriculum.choices import CHOICES,SERVICES,PRODUCTS
A=ROOT/'assets/samples'
FILLED={
'website':'''PRACTICE DEMO: BrightStep English tutor
Headline: English lessons for adults who want more speaking practice.
Introduction: Choose a one-to-one lesson focused on the conversations you need. Tell us your current level and what you want to practise before we agree a lesson plan.
Services: Conversation practice / Workplace vocabulary / Guided reading.
FAQ: How do I start? Send your level and learning goal. What happens first? We discuss your goal and explain the lesson format. Is progress guaranteed? No. Lesson outcomes depend on many factors.
Button: Ask about a lesson.
Approved demo facts: adult learners, online lessons, enquiry before booking. No invented prices or results.
Delivery: index.html, tested preview URL, editable source, link-test list and update guide.
The accompanying website-demo.html shows a complete static practice page. It has no booking backend.''',
'copy':'''FICTIONAL BUYER: BrightStep tutor
Original: Unlock your full potential with the best lessons!
Suggested headline: English conversation lessons for adult learners.
Introduction: Practise the conversations you need for work or daily life. Tell us your level and goal, then ask how a first lesson works.
Three useful points: One-to-one practice / Topics agreed from your goal / Clear enquiry before booking.
Button: Ask about a first lesson.
FAQ: Do I need advanced English? Tell the tutor your current level before booking. Are lessons online? This demo assumes online lessons. Is a result guaranteed? No. Can I choose a topic? Ask the tutor what is available. What does it cost? The real owner must confirm fees.
Why this is clearer: names the service, names the reader, gives one next action. No claim about measured conversion.
Delivery: editable copy document and PDF with placement notes.''',
'design':'''FICTIONAL BUYER: FrameNote Photography
Five-slide booking FAQ:
1 Heading: Planning a small event? Body: Ask about photography that fits your event.
2 Heading: Start with the basics. Body: Share your event date, venue and approximate guest count.
3 Heading: Agree what is covered. Body: Ask which moments, time window and final photos are included.
4 Heading: Check the delivery. Body: Confirm file format, expected date and usage rights in writing.
5 Heading: Ready to ask? Body: Send the event details through the photographer’s approved enquiry link.
Three single-post concepts: what to include in an enquiry / what the package covers / how final photos are delivered.
Layout: pale background, dark headline, one plum accent, large text and a small slide number. Use your own or approved images.
Delivery: five ordered PNGs, three post exports and an editable original where licensed.
Check: read all text at phone size, confirm facts with the photographer, tap the final enquiry link.''',
'video':'''PRACTICE SOURCE: record yourself reading this 60-second explanation.
Core spoken answer: Before you ask for an event photography quote, send the date, venue and what you want covered. Then confirm hours, final files and when they arrive. A clear enquiry helps both sides agree the work.
30-second edit plan:
0–3: final checklist on screen. Caption: Three details for a clearer quote.
3–8: speaker says date and venue. Cut opening pause.
8–16: show the requested moments and hours as readable text.
16–24: show file type and delivery date questions.
24–30: show final checklist. Caption: Save this before you enquire.
Delivery target: one MP4 practice edit, then three clips for an agreed client package. This text is a shot plan, not finished video footage.
Check: listen and watch muted, correct captions, use only authorized footage/music.''',
'social':'''FICTIONAL BUYER: ClearFix Repairs
Approved facts: device assessment before repair quote. Final price/timing confirmed by owner.
1 FAQ: Not sure what is wrong with your device? Send the model and describe what happens. Ask how an assessment works before agreeing repair work.
2 Details: A useful enquiry names the device, the issue and when you noticed it. Never put your password in a public comment.
3 Quote: Ask what the assessment includes and whether there is a fee. The owner confirms repair scope and price after checking the device.
4 Timing: Describe how urgently you need the device. A repair date must be agreed, not guessed from a general post.
5 Approval: Review the written quote and ask about unclear items before approving work.
6 Pickup: Check the agreed repair and actual support terms when collecting the device.
7 Next question: What part of the assessment process would you like explained? Use actual questions to plan the next post.
Image ideas: enquiry checklist / assessment-to-quote steps / approval reminder. All are illustrations, not customer proof.
Delivery: seven captions, calendar and three simple design suggestions.''',
'listings':'''FICTIONAL PRODUCT: DeskKind organizer
Verified practice facts: three compartments, 20 × 10 × 8 cm, intended for pens and small notes.
Title: Three-compartment desk organizer, 20 × 10 × 8 cm.
Description: Keep pens and small notes together in a compact desk organizer. It has three compartments and measures 20 × 10 × 8 cm. Measure your available space before ordering. Check the seller’s current material, price, delivery and return details on the real product page.
FAQs: Will it fit? Compare the stated dimensions with your desk. What fits inside? The brief names pens and small notes. What is the material? Unknown until the owner confirms. Is delivery free? Check the real seller terms. Does it improve productivity? No measured result is claimed.
Image text: Check the size / Three compartments / See current delivery terms.
Delivery target: five product sections from five approved fact sheets. This is one complete practice listing.''',
'emails':'''FICTIONAL SIGNUP: a person requested a workshop planning checklist.
Email 1 subject: Your workshop checklist
Preview: Start with the date and the one thing attendees should do.
Body: Here is the checklist you requested: [real resource link]. Start by writing your date, audience and workshop goal. Then list the first three planning actions. Reply if a heading is unclear.
Email 2 subject: Choose the first three tasks
Preview: Keep the plan small enough to finish.
Body: Open your checklist and add the venue, session outline and materials you need to confirm. Assign a next action and date to each. You do not need a full event system to start.
Email 3 subject: What is still unclear?
Preview: Check the costs and owner of each task.
Body: Before inviting people, check who owns each task and which costs are agreed. If you want the complete planning pack, inspect the actual preview here: [real product link]. Decide whether it fits your event.
Replace links with working resources before delivery. Send only through the client’s permitted subscriber system. No automated sending included.''',
'slides':'''FICTIONAL WORKSHOP: Plan a clearer client project.
Slide 1: Agree the work before starting. Three points: exact files, deadline, approver. Speaker note: a vague request is not a finished agreement.
Slide 2: Make one small first piece. Three points: approved facts, useful output, clear check. Speaker note: review the first piece before repeating it.
Slide 3: Deliver files people can use. Three points: final exports, editable originals, Start here note. Speaker note: check access from another browser.
Before: crowded paragraphs with no clear titles.
After: one message per slide, readable bullets and consistent title position.
Delivery target: ten cleaned slides from supplied content. This three-slide excerpt shows the structure, not invented business metrics.''',
'research':'''PRACTICE RESEARCH FORMAT / ALL ROWS BELOW ARE FICTIONAL
Business: Example photo studio. Source: [open the real business page]. Checked date: [actual date]. Observation: enquiry page asks for a date but does not explain final file delivery. Possible help: clearer FAQ copy. Contact route: public business enquiry form. Unknowns: budget, interest, approval owner.
Business: Example tutor. Observation: public post asks what to include in a lesson enquiry. Possible help: short enquiry form. Source/contact/date: verify on the real profile.
Business: Example creator. Observation: asks publicly for editing help. Possible help: three short clips from authorized footage. Source/contact/date: verify.
Business: Example maker. Observation: listing omits dimensions in the supplied approved sheet. Possible help: factual product descriptions. Source/contact/date: verify.
Business: Example consultant. Observation: asks for a workshop slide cleanup. Possible help: supplied ten-slide deck. Source/contact/date: verify.
These are examples of row structure, not real leads. A paid research delivery must contain ten real rows with opened source links and honest unknowns.''',
'workflow':'''FICTIONAL TUTOR ENQUIRY FORM
Title: Ask about an English lesson.
Description: Share your goal so we can explain whether the lesson format fits. This practice form uses no real personal data.
Questions: Name / Business or contact email / Current level / What you want to practise / Optional note. Mark only necessary fields required.
Response Sheet columns: Timestamp, Name, Email, Level, Goal, Note, Status, Follow-up date, Owner.
Status choices: New, Replied, Agreed, Closed.
Tests: submit fake enquiry → one new row. Set Status to Replied → dropdown accepts it. Open public form in private window → can respond. Open response-sheet link without permission → cannot see private responses.
Delivery: client-owned Form, linked Sheet, permissions check and one-page use guide.
No passwords, health records, automated emails or payment system included.'''
}
PRODUCT_ROWS={
'project-kit':(['Stage','Fictional example','Your project'],[['Buyer','New freelance designer',''],['Reader and task','Client needs a booking FAQ graphic',''],['Files','Five-slide carousel plus three post images',''],['Inputs','Approved copy, logo, colors, enquiry URL',''],['Exclusions','Posting and guaranteed leads',''],['Deadline','Agree after complete inputs',''],['Check','Phone text readable, links correct',''],['Delivery','Final PNGs, editable original, Start here note',''],['Approval','Client checks facts and revision list','']]),
'job-tracker':(['Company','Role','Link','Applied date','Status','Next action','Next date','Notes'],[['Fictional Studio A','Junior designer','https://example.com','2026-10-06','Applied','Check stated response timeline','2026-10-13','Practice row, not a live job'],['Fictional Team B','Assistant','https://example.com','','Saved','Read role requirements','','Practice row'],['Fictional Group C','Editor','https://example.com','2026-10-05','Interview','Prepare questions','2026-10-08','Practice row']]),
'content-planner':(['Day','Reader question','Topic','Caption draft','Image','Next action','Approved'],[['Monday','What should I send for a quote?','Enquiry details','Share the event date, venue and what you want covered. Ask which files and hours are included.','Simple checklist','Use the approved enquiry link','Practice only'],['Tuesday','When will files arrive?','Delivery','Confirm the file format and delivery date before agreeing the project.','File examples','Ask the owner','Practice only'],['Wednesday','What is included?','Scope','Read the actual package and ask about unclear items.','Package checklist','Review the package','Practice only']]),
'media-kit':(['Section','Fictional example','Your verified details'],[['Profile','Demo creator who teaches simple desk setups',''],['Audience','Use actual analytics, date and source. No invented stats',''],['Sample work','Link to a real authorized example',''],['Services','One tutorial or short product demonstration',''],['Process','Agree scope, inspect item, draft, review, deliver',''],['Rates','Quote after scope, no invented market rate',''],['Contact','Use your real business contact','']]),
'budget-sheet':(['Date','Description','Type','Category','Amount'],[['2026-10-01','Fictional monthly receipt','Income','Income','500'],['2026-10-02','Fictional groceries','Expense','Food','40'],['2026-10-03','Fictional transport','Expense','Transport','15'],['2026-10-04','Fictional internet','Expense','Utilities','20']]),
'event-planner':(['Task','Owner','Due date','Estimated cost','Agreed cost','Paid','Next action'],[['Confirm venue','Demo organizer','2026-10-10','100','','','Ask venue for terms'],['Prepare session outline','Demo speaker','2026-10-12','0','0','0','Write three learning tasks'],['Check materials','Demo organizer','2026-10-15','30','','','List what attendees need']]),
'study-planner':(['Subject','Task','Due date','Estimated minutes','Next action','Status'],[['Fictional English','Read assigned passage','2026-10-09','30','Read and note three questions','Planned'],['Fictional maths','Practice worksheet','2026-10-10','45','Attempt the first five problems','Planned'],['Weekly review','Check next deadlines','2026-10-11','15','Open task list and update dates','Planned']]),
'craft-affiliate':(['Check','Fictional demonstration / not a tested real item','Your verified finding'],[['Program eligibility','Unknown until official country/account check',''],['Item','Demo stencil set',''],['Contents','Count actual pieces before claiming',''],['Use test','Try one design on a permitted practice surface',''],['Limitation','Check size and compatible materials',''],['Disclosure','I may earn commission from the approved link',''],['Payout','Check approved and available commission separately','']]),
'bedding-affiliate':(['Check','Fictional demonstration / not a tested real item','Your verified finding'],[['Eligibility','Check actual country/account',''],['Item','Demo pillowcase set',''],['Dimensions','Measure actual item and compare label',''],['Contents','Show actual number of pieces',''],['Material','Read real fabric label',''],['Limitation','No sleep or health benefit claimed',''],['Disclosure','Use clear affiliate disclosure',''],['Payout','Check settlement and available funds','']]),
'phone-affiliate':(['Check','Fictional demonstration / not a tested real item','Your verified finding'],[['Eligibility','Check actual country/account',''],['Item','Demo phone stand',''],['Device','Record tested phone and case',''],['Fit','Test portrait and landscape on a desk',''],['Limitation','Do not generalize beyond tested device',''],['Disclosure','Use clear affiliate disclosure',''],['Payout','Record approved commission, returns and availability','']])
}

def build_offer_pages():
 rows='';interview='''<section class="offer-interview"><span class="eyebrow">A short interview</span><h2>Not sure which one fits?</h2><p>Answer three practical questions. We’ll suggest options you can inspect. This is a starting suggestion, not a skill test or earnings forecast.</p><button id="offer-interview-start">Help me choose →</button><form id="offer-interview" hidden><fieldset data-offer-question="0"><legend>What kind of work feels most comfortable?</legend><label><input type="radio" name="oi0" value="words">Writing and explaining</label><label><input type="radio" name="oi0" value="visual">Design and visual work</label><label><input type="radio" name="oi0" value="organize">Organizing things clearly</label><label><input type="radio" name="oi0" value="research">Finding and checking information</label><label><input type="radio" name="oi0" value="build">Building and testing a small tool</label></fieldset><fieldset data-offer-question="1" hidden><legend>What can you make time for?</legend><label><input type="radio" name="oi1" value="short">A small first project over a few sessions</label><label><input type="radio" name="oi1" value="patient">A longer build with careful testing</label></fieldset><fieldset data-offer-question="2" hidden><legend>Which starting setup can you use?</legend><label><input type="radio" name="oi2" value="digital">My computer or phone, with free tools</label><label><input type="radio" name="oi2" value="media">My own footage or a real product I can inspect</label></fieldset><div class="quiz-nav"><button type="button" class="secondary" id="offer-interview-back" disabled>← Back</button><button type="button" id="offer-interview-next" disabled>Next question →</button></div></form><div id="offer-recommendation" hidden aria-live="polite"></div></section>'''
 for t,cs in CHOICES.items():
  offers=''
  for n,c in enumerate(cs,1):
   kinds={'service':'Client service','download':'Reusable download','affiliate':'Physical-product affiliate'}
   offers+=f'''<article class="offer-row" data-offer-id="{c['id']}" data-offer-tags="{','.join(c['tags'])}" data-offer-kind="{c['kind']}"><details class="quiet-details"><summary><span class="offer-num">{n:02}</span><span><small>{kinds[c['kind']]}</small>{E(c['name'])}</span><span aria-hidden="true">+</span></summary><div class="offer-detail"><p class="lede">{E(c['sell'])}</p><dl class="offer-facts"><dt>Who might buy it</dt><dd>{E(c['buyer'])}</dd><dt>Practice time</dt><dd>{E(c['hours'])}. Planning estimate for a first version, not a deadline or proof of expertise. Add time for feedback and revisions.</dd><dt>What helps</dt><dd>{E(c['skill'])}</dd><dt>Why it can work</dt><dd>{E(c['pro'])}</dd><dt>What to watch</dt><dd>{E(c['con'])}</dd></dl><p><b>First example:</b> {E(c['sample'])}</p><details class="quiet-details"><summary>Why we included it / source and limits</summary><div><p>{E(c['evidence'])}</p><a href="{E(c['source'])}" target="_blank" rel="noopener">Open the research source ↗</a></div></details><button data-save-choice="{c['id']}">Choose {E(c['name'].lower())} →</button></div></details></article>'''
  rows+=f'<section data-choice-track="{t}" hidden><h2>{"Ten services you can sell" if t=="service" else "Ten product ideas you can test"}</h2><p>{"Start with one small package. Make a checked sample before taking paid work." if t=="service" else "Recommended low-cost starting point: the freelancer project-start kit, if you can reach freelancers for feedback. Seven downloads and three physical-product niches are included. Physical samples and account eligibility may add cost."}</p>{offers}<article class="offer-row own-offer"><h3>I have my own {"service" if t=="service" else "product"}.</h3><p>No text entry required. The shared guide will still show the steps. Use the closest example for reference.</p><button class="secondary" data-save-choice="custom">Use my own {"service" if t=="service" else "product"} →</button></article></section>'
 body=hero('Your track / choose one offer','What will you sell?','Choose the work you want to try first. You can change this offer later without erasing your notes. Changing the service/product track is a separate confirmed reset.')+'<div data-no-track hidden><a class="button" href="/quiz.html">Get my track first ↗</a></div><div data-journey hidden><div class="selected-offer"><span class="eyebrow">Saved offer</span><h2 data-choice-name>No offer selected yet</h2><p data-choice-description>Choose an option below, then open your next step.</p><a class="button" href="/checklist.html" data-choice-next hidden>Show my next steps ↗</a><p class="status" data-choice-status role="status"></p></div>'+interview+rows+'</div><p class="status" data-track-status role="status">Opening your track…</p>'
 write('choose.html','Choose my offer',body,'choice')
 for c in SERVICES:
  (A/(c['id']+'-example.txt')).write_text('WHAT THIS FILE IS\nA filled fictional example for '+c['name']+'. It shows the shape of work a client could receive. This is not commissioned work or client-results proof.\n\n'+FILLED[c['id']]+'\n\nMAKE YOUR VERSION\n'+ '\n'.join(f'{i}. {s}' for i,s in enumerate(c['recipe'],1))+'\n\nFINAL CHECK\n'+c['check']+'\n')
 for c in PRODUCTS:
  headers,rs=PRODUCT_ROWS[c['id']]
  for suffix,rows_to_write in [('starter',rs),('blank',[['']*len(headers) for _ in range(8)])]:
   with (A/f'{c["id"]}-{suffix}.csv').open('w') as f:w=csv.writer(f,lineterminator='\n');w.writerow(headers);w.writerows(rows_to_write)
 examplebody=hero('See finished work / practice only','What would I send to a client?','This page shows the kind of work each service produces. Choose an example, read the filled practice file, then make your own version using approved facts. These are fictional exercises, not real clients.')+context_selector('service')
 for c in SERVICES:
  examplebody+=f'<section data-choice-content="{c["id"]}" hidden><h2>{E(c["name"])}</h2><p><b>Why this is here:</b> to show what {E(c["sell"].lower())} looks like.</p><pre class="finished-example">{E(FILLED[c["id"]])}</pre><a href="/assets/samples/{c["id"]}-example.txt" download>Download the filled practice file ↓</a><h3>Make your own version</h3>{recipe(c)}{prompt("Prompt for this service",c["prompt"])}</section>'
 examplebody+='<div data-choice-content="custom"><p>Select the closest service example above. You can inspect all ten without changing your saved offer.</p></div><p><a href="/assets/samples/website-demo.html" target="_blank" rel="noopener">Open the complete static website demo ↗</a> · <a href="/assets/samples/content-delivery.html">Open seven filled captions and layouts ↗</a></p>'
 write('assets/samples/service-examples.html','Service examples',examplebody,'examples')
 body=hero('See a product’s first useful task','What does the buyer actually use?','Choose one of the ten product ideas. The CSV files are practice starters with labeled fictional inputs, not a finished product to sell unchanged. The guide explains how to make a complete version and test it.')+context_selector('product')
 for c in PRODUCTS:
  body+=f'<section data-choice-content="{c["id"]}" hidden><h2>{E(c["name"])}</h2><p>{E(c["sell"])}</p><p><b>First useful task:</b> {E(c["sample"])}</p><p>{E(c["evidence"])}</p><div class="actions"><a href="/assets/samples/{c["id"]}-starter.csv" download>Filled practice worksheet ↓</a><a href="/assets/samples/{c["id"]}-blank.csv" download>Blank worksheet ↓</a></div><h3>Build and test your version</h3>{recipe(c)}{prompt("Prompt for this product",c["prompt"])}</section>'
 body+='<div data-choice-content="custom"><p>Select the closest product example above. Start with a small first task, then test it with a likely buyer.</p></div>'
 write('assets/samples/product-examples.html','Product examples',body,'examples')
 demo=hero('Complete static practice page / fictional business','BrightStep English lessons.','Online conversation practice for adult learners. This is a website-building example, not a real tutoring business.')+'''<section class="section"><h2>Practise the conversations you need.</h2><p>Tell the tutor your current level and what you want to work on. The lesson format and fees would be confirmed before a booking.</p><a class="button" href="#demo-contact">Ask about a lesson</a></section><section class="section"><h2>Three starting topics</h2><ul><li>Everyday conversation practice</li><li>Workplace vocabulary</li><li>Guided reading and discussion</li></ul></section><section class="section"><h2>Before a first lesson</h2><details class="quiet-details"><summary>How would I start?</summary><div><p>Send your current level and the conversation you want to practise.</p></div></details><details class="quiet-details"><summary>Is progress guaranteed?</summary><div><p>No. This demo describes a lesson format, not a promised learning result.</p></div></details><details class="quiet-details"><summary>What does it cost?</summary><div><p>The real business owner must supply an approved price. This fictional demo does not invent one.</p></div></details></section><section class="section" id="demo-contact"><h2>Demo contact step</h2><p>A real version would link to the owner’s approved enquiry channel. This practice page intentionally sends no message and takes no booking.</p><a href="/playbooks/playbook-f-content-service.html" target="_blank" rel="noopener">Learn to build, test and publish your page ↗</a></section>'''
 write('assets/samples/website-demo.html','Website practice demo',demo,'examples')
