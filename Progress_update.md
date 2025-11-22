hey everyone! just finished building an automated crawler for csconfs and wanted to share what's working (and what's not lol)

## progress so far
basically a smart crawler that:
- uses the conference "series homepage" (like `aaai.org`) to find next year's page
- feeds the HTML to Google's Gemini AI to extract dates, locations, and deadlines
- outputs suggestions to a YAML file for manual review before merging

## the good stuff 
- **coverage**: covers around **41 major series** (~55% of the dataset!)
- **latest script run results**: found **8 new conferences** ready to add:
  - NAACL 2026 (San Diego)
  - SIGMOD 2027 (Huntington Beach)
  - ICCAD 2025 (Munich)
  - SIGMETRICS 2026 (Ann Arbor)
  - CGO 2026 (Sydney)
  - SIGGRAPH 2026 (LA)
  - SIGGRAPH Asia 2026 (Kuala Lumpur)
  - UIST 2026 (Detroit)
- **accuracy**: added filters to prevent false positives (eg matching PDFs or journal pages, because that was an issue that kept happening)


## some limitations
**timing issues**
- conferences announce their next year at different times
- some are already planning 2027, others haven't posted 2026 yet
- ran it today: 41 conferences checked, only 8 had new pages live

**hosting chaos**
- some conferences switch between official domains and GitHub Pages every year (for example ICDE sometimes uses icde2026.github.io and sometimes ieee-icde.org/2025, so it is very inconsistent)
- had to exclude ICDE and VLDB because their URL patterns are too unpredictable, this will also have to be done for the conferences not yet covered by the crawler

**cost/rate limits**
- uses Gemini API ($$$) so can't run it constantly
- has 2-sec delay between requests to be polite
- realistically, the script should probably be ran bi-weekly or once a month

**manual review required**
- outputs to `suggested_updates_llm.yaml` instead of auto-merging
- you still need to copy-paste into the main file
- safer than accidentally breaking the dataset

## the workflow
```bash
# run the crawler
./.venv/bin/python scripts/update_confs_llm.py

# review suggested_updates_llm.yaml
# copy good entries to public/data/conferences.yaml
```

## summary
it's not perfect but it's WAY better than manually checking 70+ conference websites every month. should save a ton of time once conferences start announcing their 2026/2027 dates 

**coverage breakdown by area:**
- **AI/ML** (6): AAAI, ICML, NeurIPS, ICLR, IJCAI, KDD
- **Computer Vision** (5): CVPR, ICCV, ECCV, SIGGRAPH, SIGGRAPH Asia
- **Architecture/Hardware** (6): ISCA, MICRO, HPCA, DAC, ICCAD, CGO
- **Systems** (4): OSDI, SOSP, EuroSys, FAST
- **Software Engineering** (3): ICSE, ISSTA, OOPSLA
- **Databases** (2): SIGMOD, PODS
- **Security** (2): CCS, NDSS
- **Bioinformatics** (2): ISMB, RECOMB
- **Theory** (2): CAV, LICS
- **Visualization** (2): VIS, VR
- **Networking** (2): SIGCOMM, IMC
- **NLP** (1): NAACL
- **Performance** (1): SIGMETRICS
- **Robotics** (1): ICRA
- **HCI** (1): UIST
- **Information Retrieval** (1): SIGIR

lmk if you have questions or want to expand coverage to more conferences
