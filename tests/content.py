from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import sys
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R))
from curriculum.books import BOOKS
class Parse(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.links=[];self.ids=[];self.prompts=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
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
assert len(BOOKS)==10
for b in BOOKS:
 assert len(b['steps'])>=5 and len(b['free'])>=2 and len(b['paid'])>=2
 assert (R/b['path']).exists() and (R/'assets/samples'/b['example']['asset']).exists()
 assert all(x in {v['letter'] for v in BOOKS} for x in b['next'])
 assert all(len(s['prompt'])>100 and s['check'] and s['output'] for s in b['steps'])
assert not errors,'\n'.join(errors)
print(f'{count} HTML pages: local links, IDs, 10 playbooks, 50 + 300 prompts and all downloads pass.')
