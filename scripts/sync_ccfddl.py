#!/usr/bin/env python3
"""
CCFDDL Sync, Verification & Acceptance Rate Tool for CSConfs

Compares public/data/conferences.yaml against community-maintained data from
https://github.com/ccfddl/ccf-deadlines

Usage:
  python3 scripts/sync_ccfddl.py           # Dry run / report discrepancies
  python3 scripts/sync_ccfddl.py --apply   # Apply verified updates & acceptance rates
"""

import os
import sys
import argparse
import yaml
import requests
import time
import re
from concurrent.futures import ThreadPoolExecutor

CONF_MAP = {
    'AAAI': ('conference/AI/aaai.yml', 'accept_rates/AI/aaai.yml'),
    'ACL': ('conference/AI/acl.yml', 'accept_rates/AI/acl.yml'),
    'ASE': ('conference/SE/ase.yml', 'accept_rates/SE/ase.yml'),
    'ASPLOS': ('conference/DS/asplos.yml', 'accept_rates/DS/asplos.yml'),
    'CAV': ('conference/CT/cav.yml', 'accept_rates/CT/cav.yml'),
    'CCS': ('conference/SC/ccs.yml', 'accept_rates/SC/ccs.yml'),
    'CGO': ('conference/DS/cgo.yml', 'accept_rates/DS/cgo.yml'),
    'CHI': ('conference/HI/chi.yml', 'accept_rates/HI/chi.yml'),
    'CVPR': ('conference/AI/cvpr.yml', 'accept_rates/AI/cvpr.yml'),
    'Crypto': ('conference/SC/crypto.yml', 'accept_rates/SC/crypto.yml'),
    'DAC': ('conference/DS/dac.yml', 'accept_rates/DS/dac.yml'),
    'EC': ('conference/MX/ec.yml', 'accept_rates/MX/ec.yml'),
    'ECCV': ('conference/AI/eccv.yml', 'accept_rates/AI/eccv.yml'),
    'EMNLP': ('conference/AI/emnlp.yml', 'accept_rates/AI/emnlp.yml'),
    'EMSOFT': ('conference/MX/emsoft.yml', 'accept_rates/MX/emsoft.yml'),
    'EuroSys': ('conference/DS/eurosys.yml', 'accept_rates/DS/eurosys.yml'),
    'Eurocrypt': ('conference/SC/eurocrypt.yml', 'accept_rates/SC/eurocrypt.yml'),
    'Eurographics': ('conference/CG/eg.yml', 'accept_rates/CG/eg.yml'),
    'FAST': ('conference/DS/fast.yml', 'accept_rates/DS/fast.yml'),
    'FSE': ('conference/SE/fse.yml', 'accept_rates/SE/fse.yml'),
    'HPCA': ('conference/DS/hpca.yml', 'accept_rates/DS/hpca.yml'),
    'HPDC': ('conference/DS/hpdc.yml', 'accept_rates/DS/hpdc.yml'),
    'ICCAD': ('conference/DS/iccad.yml', 'accept_rates/DS/iccad.yml'),
    'ICCV': ('conference/AI/iccv.yml', 'accept_rates/AI/iccv.yml'),
    'ICDE': ('conference/DB/icde.yml', 'accept_rates/DB/icde.yml'),
    'ICFP': ('conference/SE/icfp.yml', 'accept_rates/SE/icfp.yml'),
    'ICLR': ('conference/AI/iclr.yml', 'accept_rates/AI/iclr.yml'),
    'ICML': ('conference/AI/icml.yml', 'accept_rates/AI/icml.yml'),
    'ICRA': ('conference/AI/icra.yml', 'accept_rates/AI/icra.yml'),
    'ICSE': ('conference/SE/icse.yml', 'accept_rates/SE/icse.yml'),
    'IEEE S&P': ('conference/SC/sp.yml', 'accept_rates/SC/sp.yml'),
    'IJCAI': ('conference/AI/ijcai.yml', 'accept_rates/AI/ijcai.yml'),
    'IMC': ('conference/NW/imc.yml', 'accept_rates/NW/imc.yml'),
    'IROS': ('conference/AI/iros.yml', 'accept_rates/AI/iros.yml'),
    'ISCA': ('conference/DS/isca.yml', 'accept_rates/DS/isca.yml'),
    'ISMB': ('conference/MX/ismb.yml', 'accept_rates/MX/ismb.yml'),
    'ISMB/ECCB': ('conference/MX/ismb.yml', 'accept_rates/MX/ismb.yml'),
    'ISSTA': ('conference/SE/issta.yml', 'accept_rates/SE/issta.yml'),
    'KDD': ('conference/DB/kdd.yml', 'accept_rates/DB/kdd.yml'),
    'LICS': ('conference/CT/lics.yml', 'accept_rates/CT/lics.yml'),
    'MICRO': ('conference/DS/micro.yml', 'accept_rates/DS/micro.yml'),
    'MobiCom': ('conference/NW/mobicom.yml', 'accept_rates/NW/mobicom.yml'),
    'MobiSys': ('conference/NW/mobisys.yml', 'accept_rates/NW/mobisys.yml'),
    'NAACL': ('conference/AI/naacl.yml', 'accept_rates/AI/naacl.yml'),
    'NDSS': ('conference/SC/ndss.yml', 'accept_rates/SC/ndss.yml'),
    'NSDI': ('conference/NW/nsdi.yml', 'accept_rates/NW/nsdi.yml'),
    'NeurIPS': ('conference/AI/nips.yml', 'accept_rates/AI/nips.yml'),
    'OOPSLA': ('conference/SE/oopsla.yml', 'accept_rates/SE/oopsla.yml'),
    'OSDI': ('conference/SE/osdi.yml', 'accept_rates/SE/osdi.yml'),
    'PLDI': ('conference/SE/pldi.yml', 'accept_rates/SE/pldi.yml'),
    'PODS': ('conference/DB/pods/pods.yml', 'accept_rates/DB/pods.yml'),
    'POPL': ('conference/SE/popl.yml', 'accept_rates/SE/popl.yml'),
    'RECOMB': ('conference/MX/recomb.yml', 'accept_rates/MX/recomb.yml'),
    'RSS': ('conference/AI/rss.yml', 'accept_rates/AI/rss.yml'),
    'RTAS': ('conference/DS/rtas.yml', 'accept_rates/DS/rtas.yml'),
    'RTSS': ('conference/MX/rtss.yml', 'accept_rates/MX/rtss.yml'),
    'SIGCOMM': ('conference/NW/sigcomm.yml', 'accept_rates/NW/sigcomm.yml'),
    'SIGGRAPH': ('conference/CG/siggraph.yml', 'accept_rates/CG/siggraph.yml'),
    'SIGGRAPH Asia': ('conference/CG/siggraph-asia.yml', 'accept_rates/CG/siggraph-asia.yml'),
    'SIGIR': ('conference/DB/sigir.yml', 'accept_rates/DB/sigir.yml'),
    'SIGMETRICS': ('conference/DS/sigmetrics.yml', 'accept_rates/DS/sigmetrics.yml'),
    'SIGMOD': ('conference/DB/sigmod.yml', 'accept_rates/DB/sigmod.yml'),
    'SOSP': ('conference/SE/sosp.yml', 'accept_rates/SE/sosp.yml'),
    'UIST': ('conference/HI/uist.yml', 'accept_rates/HI/uist.yml'),
    'USENIX ATC': ('conference/DS/atc.yml', 'accept_rates/DS/atc.yml'),
    'USENIX Security': ('conference/SC/uss.yml', 'accept_rates/SC/uss.yml'),
    'UbiComp / ISWC': ('conference/HI/ubicomp.yml', 'accept_rates/HI/ubicomp.yml'),
    'VIS': ('conference/CG/vis.yml', 'accept_rates/CG/vis.yml'),
    'VLDB': ('conference/DB/vldb.yml', 'accept_rates/DB/vldb.yml'),
    'VR': ('conference/CG/vr.yml', 'accept_rates/CG/vr.yml'),
    'WINE': ('conference/MX/wine.yml', 'accept_rates/MX/wine.yml'),
    'WWW': ('conference/MX/www.yml', 'accept_rates/MX/www.yml'),
}

RAW_BASE = "https://raw.githubusercontent.com/ccfddl/ccf-deadlines/main/"

def fetch_yaml(rel_path):
    if not rel_path:
        return None
    url = RAW_BASE + rel_path
    headers = {'User-Agent': 'CSConfs-Sync-Tool/1.0'}
    for attempt in range(2):
        try:
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                return yaml.safe_load(r.text)
        except Exception:
            time.sleep(0.5)
    return None

def fetch_conf_and_rates(item):
    name, (conf_rel, rate_rel) = item
    conf_data = fetch_yaml(conf_rel)
    rate_data = fetch_yaml(rate_rel)
    return name, conf_data, rate_data

def normalize_date(date_str):
    if not date_str:
        return None
    m = re.search(r'(\d{4}-\d{2}-\d{2})', str(date_str))
    if m:
        return m.group(1)
    return str(date_str)

def main():
    parser = argparse.ArgumentParser(description="Sync, verify, and enrich CSConfs dates and acceptance rates against CCFDDL.")
    parser.add_argument("--apply", action="store_true", help="Apply verified updates & acceptance rates to conferences.yaml")
    parser.add_argument("--year", type=int, default=2024, help="Target minimum year to audit (default: 2024)")
    args = parser.parse_args()

    yaml_path = "public/data/conferences.yaml"
    with open(yaml_path, "r") as f:
        local_confs = yaml.safe_load(f)

    print(f"Loaded {len(local_confs)} entries from {yaml_path}")
    print(f"Fetching CCFDDL data and acceptance rates in parallel...\n")

    ccf_confs = {}
    ccf_rates = {}

    with ThreadPoolExecutor(max_workers=20) as executor:
        for name, conf_data, rate_data in executor.map(fetch_conf_and_rates, CONF_MAP.items()):
            if conf_data:
                ccf_confs[name] = conf_data
            if rate_data:
                ccf_rates[name] = rate_data

    print(f"Fetched {len(ccf_confs)} conference records and {len(ccf_rates)} acceptance rate files.\n")

    # Map local confs by index and (name, year)
    local_by_key = {}
    for idx, item in enumerate(local_confs):
        if isinstance(item, dict) and 'name' in item and 'year' in item:
            key = (item['name'], int(item['year']))
            local_by_key.setdefault(key, []).append((idx, item))

    updates_count = 0
    rates_applied = 0

    # 1. Process Acceptance Rates
    for name, rate_data in ccf_rates.items():
        if isinstance(rate_data, list) and len(rate_data) > 0:
            accept_list = rate_data[0].get('accept_rates', [])
            for r_item in accept_list:
                year = r_item.get('year')
                rate_val = r_item.get('rate')
                if year and rate_val is not None:
                    try:
                        r_float = float(str(rate_val).replace('%', '').strip())
                        if r_float > 1.0:
                            r_float = r_float / 100.0
                        if r_float > 0:
                            key = (name, year)
                            if key in local_by_key:
                                pct = round(r_float * 100, 2)
                                for idx, item in local_by_key[key]:
                                    if not item.get('acceptance_rate'):
                                        item['acceptance_rate'] = pct
                                        rates_applied += 1
                    except ValueError:
                        pass

    # 2. Process Dates & Discrepancies
    for name, ccf_data in ccf_confs.items():
        if not isinstance(ccf_data, list):
            continue

        ccf_entry = ccf_data[0]
        confs_list = ccf_entry.get('confs', [])

        for c_year_item in confs_list:
            year = c_year_item.get('year')
            if not year or year < args.year:
                continue

            key = (name, year)
            local_tuples = local_by_key.get(key, [])
            timeline = c_year_item.get('timeline', [])

            for cycle_idx, t_item in enumerate(timeline):
                ccf_dl = normalize_date(t_item.get('deadline'))
                ccf_abs = normalize_date(t_item.get('abstract_deadline'))

                if cycle_idx < len(local_tuples):
                    idx, item = local_tuples[cycle_idx]
                    local_dl = normalize_date(item.get('deadline'))

                    if ccf_dl:
                        if item.get('estimated') and local_dl != ccf_dl:
                            print(f"✨ [AUTO-FIX ESTIMATED] {name} {year} Cycle {cycle_idx+1}: {local_dl} ➔ {ccf_dl}")
                            item['deadline'] = ccf_dl
                            if ccf_abs:
                                item['abstract_deadline'] = ccf_abs
                            item.pop('estimated', None)
                            item['verified'] = True
                            updates_count += 1
                        elif local_dl == ccf_dl:
                            item['verified'] = True

    print(f"\n=========================================")
    print(f"SYNC SUMMARY")
    print(f"=========================================")
    print(f"✅ Acceptance Rates Applied: {rates_applied}")
    print(f"✨ Estimated Dates Upgraded to Verified: {updates_count}")

    if args.apply:
        with open(yaml_path, "w") as f:
            yaml.dump(local_confs, f, default_flow_style=False, allow_unicode=True)
        print(f"\n🚀 Successfully saved changes to {yaml_path}")
    else:
        print(f"\n💡 Run with '--apply' to write these changes to {yaml_path}")

if __name__ == "__main__":
    main()
