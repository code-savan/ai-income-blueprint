"""Shared sidebar and restrained page furniture for the Blueprint."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
E = lambda value: escape(str(value), quote=True)

def sidebar(active):
    groups = [
        ('YOUR BLUEPRINT', [('start', '01', 'Start here', '/index.html'), ('journey', '02', 'My next steps', '/checklist.html')]),
        ('WHEN YOU NEED THEM', [('books', '10', 'Playbooks', '/playbooks.html'), ('examples', '↗', 'Worked examples', '/examples.html'), ('prompts', '50', 'Action prompts', '/prompts.html'), ('tools', '↗', 'Tools & costs', '/tools.html'), ('sheets', '↗', 'My trackers', '/trackers.html')]),
    ]
    links = ''.join('<div class="nav-group"><p class="nav-label">'+label+'</p>'+''.join(f'<a href="{url}"'+(' aria-current="page"' if key == active else '')+f'><span class="nav-num">{num}</span>{title}</a>' for key,num,title,url in entries)+'</div>' for label,entries in groups)
    return f'''<aside class="sidenav" id="sidenav"><a class="brand-lockup" href="/index.html" aria-label="AI Income Blueprint home"><span class="brand-symbol">↗</span><span>AI INCOME<br><em>BLUEPRINT</em></span></a><p class="edition">FROM IDEA TO USEFUL WORK</p><nav aria-label="Main navigation">{links}</nav><div class="sidebar-bottom"><p class="saved-route" data-sidebar-track>Choose your starting track</p><a href="/profile.html" class="sidebar-profile"{' aria-current="page"' if active == 'profile' else ''}><img id="headerAvatar" src="/assets/brands/avatar.svg" alt=""><span><b id="headerName">My account</b><small>Profile & track settings</small></span><span aria-hidden="true">↗</span></a><button class="logout" id="headerLogout">Log out</button></div></aside>'''

def hero(kicker, title, description=''):
    return f'<header class="hero"><span class="eyebrow">{E(kicker)}</span><h1>{E(title)}</h1>'+ (f'<p class="lede">{E(description)}</p>' if description else '') + '</header>'

def write(path, title, body, active='books', extra_script=''):
    (ROOT/path).parent.mkdir(parents=True,exist_ok=True)
    (ROOT/path).write_text(f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{E(title)} | AI Income Blueprint</title><link rel="stylesheet" href="/assets/workbench.css?v=20261006-sidebar"></head>
<body><a class="skip" href="#main">Skip to content</a>{sidebar(active)}<button class="menu-shade" id="menu-shade" aria-label="Close navigation" hidden></button><div class="workspace"><header class="mobile-bar"><span>AI Income Blueprint</span><button class="secondary" id="menu-toggle" aria-controls="sidenav" aria-expanded="false">Menu</button></header><div class="page-bar"><span>THE BLUEPRINT / {E(title.upper())}</span><a href="/sources.html">Source notes ↗</a></div><main id="main" class="content">{body}</main><footer class="footer">Build one useful output. Check it. Put it in front of the right person.<br><a href="/sources.html">Examples & source notes</a> · Results depend on demand, skill and execution.</footer></div><script src="/js/header.js?v=20261006-sidebar"></script><script type="module" src="/js/workbench.js?v=20261006-sidebar"></script>{extra_script}</body></html>''')

def chapter(b, index=None):
    n = index if index is not None else b['letter']
    route = {'service':'Services','product':'Products','both':'Both tracks'}[b['track']]
    return f'''<article class="chapter" data-book-track="{b['track']}"><span class="chapter-number">{E(n)}</span><div><span class="eyebrow">{route} · {len(b['steps'])} steps</span><h3><a href="/{b['path']}">{E(b['title'])}</a></h3><p>{E(b['goal'])}</p></div><a class="chapter-arrow" href="/{b['path']}" aria-label="Open {E(b['title'])}">↗</a></article>'''

def flow(track):
    """A branching route diagram; text equivalents below support narrow screens."""
    is_service = track == 'service'
    choices = ['Content','Copy','Video'] if is_service else ['Template','Workbook','Eligible affiliate']
    outcome = 'One scoped service sample' if is_service else 'One complete reusable product'
    steps = ['Choose what you can deliver','Build & check the sample','Find suitable buyers','Agree scope → deliver'] if is_service else ['Find a repeated problem','Build & test the product','Demonstrate the result','Answer questions → improve']
    nodes = ''.join(f'<g><rect x="{18+i*208}" y="10" width="192" height="46" rx="3"/><text x="{114+i*208}" y="38">{E(label)}</text></g>' for i,label in enumerate(choices))
    return f'''<section class="route-map"><span class="eyebrow">Your route at a glance</span><svg class="flow-diagram" viewBox="0 0 644 186" role="img" aria-label="Choose {'content, copy or video' if is_service else 'a template, workbook or eligible affiliate route'}, build one checked output, then find buyers"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M114 56v30h416V56M322 56v57M114 86v27h208M530 86v27H322"/></g>{nodes}<rect class="flow-result" x="144" y="114" width="356" height="50" rx="3"/><text class="flow-result-text" x="322" y="144">{outcome}</text><path d="M322 164v17" stroke="currentColor"/></svg><ol class="route-sequence">{''.join(f'<li><span>{i:02}</span>{E(s)}</li>' for i,s in enumerate(steps,1))}</ol></section>'''
