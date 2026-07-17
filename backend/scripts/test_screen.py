import os
import json
from services.screening import screen_stocks, VALID_INVESTOR_KEYS

cache_dir = 'data/cache'
stocks = []
if os.path.exists(cache_dir):
    for fn in os.listdir(cache_dir):
        if fn.endswith('.json'):
            with open(os.path.join(cache_dir, fn)) as f:
                stocks.append(json.load(f))

for inv in VALID_INVESTOR_KEYS:
    print(f'\n--- TOP 10 FOR {inv.upper()} ---')
    try:
        top = screen_stocks(inv, stocks, top_n=10)
        for i, s in enumerate(top):
            print(f'{i+1}. {s["symbol"]:15} Score: {s["score"]:.1f}')
    except Exception as e:
        print(f'Error: {e}')
