import urllib.request
import re
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context
headers = {'User-Agent': 'Mozilla/5.0'}
tickers = set()

# Nifty 50
try:
    html = urllib.request.urlopen(urllib.request.Request('https://en.wikipedia.org/wiki/NIFTY_50', headers=headers)).read().decode('utf-8')
    matches = re.findall(r'<td><a rel="nofollow" class="external text" href="[^"]+">([^<]+)</a></td>', html)
    for m in matches:
        if m.strip() != 'Symbol':
            tickers.add(m.strip() + '.NS')
except Exception as e: print(e)

# Nifty Next 50
try:
    html = urllib.request.urlopen(urllib.request.Request('https://en.wikipedia.org/wiki/NIFTY_Next_50', headers=headers)).read().decode('utf-8')
    matches = re.findall(r'<td><a rel="nofollow" class="external text" href="[^"]+">([^<]+)</a></td>', html)
    for m in matches:
        tickers.add(m.strip() + '.NS')
except Exception as e: print(e)

# Nifty Midcap 100
try:
    html = urllib.request.urlopen(urllib.request.Request('https://en.wikipedia.org/wiki/NIFTY_Midcap_100', headers=headers)).read().decode('utf-8')
    # sometimes the table has a different structure, let's grab all text that looks like a stock symbol from the table
    # usually inside <td>...</td>
    matches = re.findall(r'<td>([A-Z0-9\-]+)</td>', html)
    for m in matches:
        if len(m) > 1 and m != 'Symbol':
            tickers.add(m.strip() + '.NS')
except Exception as e: print(e)

print(f'Collected {len(tickers)} tickers.')
print(list(tickers)[:5])

with open('data/stock_universe.json', 'w') as f:
    json.dump(list(tickers), f, indent=2)
