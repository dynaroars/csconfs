# Conference Crawler - Known Limitations

### VLDB
- **Problem**: Matched journal volumes instead of conference page
- **Fix**: Temporarily removed `series_link` (2027 doesn't exist yet, last is 2026)

## Improved Filters

Added filtering in `find_next_year_link()` to skip:
- File extensions: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.gif`
- Journal patterns: `journal`, `submission/`, `volumes-and-issues`
- Supporting materials: `flyer`, `poster`, `workshop`
- Admin pages: `/member`, `/login`, `/subscribe`

## Conferences with Coverage Issues

The following conferences require manual updates due to unreliable hosting patterns:

### ICDE (IEEE International Conference on Data Engineering)
- **Status**: Manual updates only
- **Reason**: Inconsistent hosting that alternates between:
  - Official domain: `ieee-icde.org/YYYY/` (e.g., 2025)
  - GitHub Pages: `icdeYYYY.github.io` (e.g., 2024, 2026)
- **Problem**: The official domain won't link to GitHub-hosted years, making auto-discovery impossible
- **Solution**: Check conference announcements manually or monitor IEEE ICDE mailing lists

### VLDB (Very Large Data Bases)
- **Status**: Temporarily disabled
- **Reason**: 2027 conference not announced yet (latest is 2026)
- **Note**: Re-enable once 2027 is officially announced on `vldb.org`

### Other Considerations
- **Database conferences**: Often host content on Springer/ACM which confuses the crawler
- **Theory conferences**: Sometimes hosted on institutional sites that change yearly
