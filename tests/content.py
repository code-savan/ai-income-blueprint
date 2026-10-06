from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import sys
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R))
from curriculum.books import BOOKS
from curriculum.choices import CHOICES,SERVICES,PRODUCTS
class Parse(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.links=[];self.ids=[];self.prompts=0;self.elements=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='a' and a.get('href','').startswith('/playbooks/'):
   assert a.get('target')=='_blank' and 'noopener' in a.get('rel',''),a
  self.elements.append((tag,a))
  if 'id' in a:self.ids.append(a['id'])
  if 'data-prompt-item' in a:self.prompts+=1
  for key in ['href','src']:
   if key in a:self.links.append(a[key])
errors=[];count=0
for file in R.rglob('*.html'):
 p=Parse();p.feed(file.read_text());count+=1
 if len(p.ids)!=len(set(p.ids)):errors.append(f'Duplicate ID: {file}')
 for url in p.links:
  u=urlparse(url)
  if u.scheme or u.netloc or not u.path:continue
  target=(R/u.path.lstrip('/')) if u.path.startswith('/') else file.parent/u.path
  if not target.is_file():errors.append(f'Broken local link: {file.relative_to(R)} -> {url}')
 if file.name=='prompts.html':assert p.prompts==50
 if file.name=='vault.html':assert p.prompts==300
 # The regression to horizontal navigation and all-at-once pages must not return.
 if file.name not in ['login.html','set-password.html','verify.html','preview.html']:
  assert any(tag=='aside' and a.get('id')=='sidenav' for tag,a in p.elements),file
 if file.name=='quiz.html':
  questions=[a for _,a in p.elements if 'data-question' in a]
  assert len(questions)==6 and sum('hidden' not in a for a in questions)==1
  assert 'quiz-next' in p.ids and 'quiz-back' in p.ids
 if file.parent.name=='playbooks':
  chapters=[a for _,a in p.elements if 'data-reader-section' in a]
  assert len(chapters)>=8 and sum('hidden' not in a for a in chapters)==1
 if file.name=='index.html':
  assert any('data-start-new' in a for _,a in p.elements)
  assert not any('data-select-track' in a for _,a in p.elements)
  assert not any('data-book-track' in a for _,a in p.elements)
 if file.name=='content-delivery.html':
  assert {a['data-example'] for _,a in p.elements if 'data-example' in a}=={'coach','repair','shop'}
assert len(BOOKS)==10
for b in BOOKS:
 assert len(b['steps'])>=5 and len(b['free'])>=2 and len(b['paid'])>=2
 assert (R/b['path']).exists() and (R/'assets/samples'/b['example']['asset']).exists()
 assert all(x in {v['letter'] for v in BOOKS} for x in b['next'])
 assert all(len(s['prompt'])>100 and s['check'] and s['output'] for s in b['steps'])
assert not errors,'\n'.join(errors)
print(f'{count} HTML pages: local links, IDs, 10 playbooks, 50 + 300 prompts and all downloads pass.')

assert len(SERVICES)==len(PRODUCTS)==10
for track,cs in CHOICES.items():
 assert len({c['id'] for c in cs})==10
 for c in cs:
  assert len(c['recipe'])>=5 and c['pro'] and c['con'] and c['check'] and c['source'].startswith('https://')
  asset=c['id']+('-example.txt' if track=='service' else '-starter.csv')
  assert (R/'assets/samples'/asset).is_file()
for b in BOOKS:
 p=Parse();p.feed((R/b['path']).read_text())
 assert any('data-context-choice' in a for _,a in p.elements)
 choices={a['data-choice-content'] for _,a in p.elements if 'data-choice-content' in a}
 expected=[c['id'] for t,cs in CHOICES.items() for c in cs if b['track'] in [t,'both']]
 assert set(expected)<=choices
p=Parse();p.feed((R/'choose.html').read_text())
assert len([a for _,a in p.elements if 'data-offer-id' in a])==20
assert len([a for _,a in p.elements if a.get('data-save-choice')=='custom'])==2
p=Parse();p.feed((R/'quiz.html').read_text());assert 'reset-consent' in p.ids and 'reset-start' in p.ids
print('20 researched offer choices, individual recipes, shared-guide examples and confirmed reset UI pass.')
