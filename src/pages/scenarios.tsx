import {useState, useMemo, type ReactNode} from 'react';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import ScenarioCard from '@site/src/components/ScenarioCard';
import {SCENARIOS, ALL_TAGS} from '@site/src/data/scenarios';
import styles from './scenarios.module.css';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ScenariosPage(): ReactNode {
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [matchAll, setMatchAll] = useState(false);
  const [shuffled] = useState(() => shuffle(SCENARIOS));
  const [alphabetical] = useState(() =>
    [...SCENARIOS].sort((a, b) => a.name.localeCompare(b.name))
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const hasFilter = q.length > 0 || activeTags.length > 0;
    const source = hasFilter ? alphabetical : shuffled;
    return source.filter((s) => {
      const matchesTags =
        activeTags.length === 0 ||
        (matchAll
          ? activeTags.every((t) => s.tags.includes(t))
          : activeTags.some((t) => s.tags.includes(t)));
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.includes(q)) ||
        s.triggerEvents.some((e) => e.includes(q));
      return matchesTags && matchesSearch;
    });
  }, [search, activeTags, matchAll, shuffled, alphabetical]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function clearAllTags() {
    setActiveTags([]);
    setMatchAll(false);
  }

  const activeFiltersLabel =
    activeTags.length === 1
      ? 'Active filter:'
      : matchAll
        ? 'Matching all of:'
        : 'Matching any of:';

  return (
    <Layout
      title="Scenario Marketplace"
      description="Browse ready-made Texter scenario automations. Copy JSON templates and configure them for your use case."
    >
      <header className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Scenario Marketplace</h1>
          <p className={styles.heroSubtitle}>
            Browse ready-made automations. Click any scenario to see what it does,
            what you need to configure, and copy the JSON directly into Texter.
          </p>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className="container">
          <div className={styles.filterRow}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search scenarios by name, description, or trigger event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search scenarios"
            />
            <div className={styles.tagFilters}>
              {/* Always-visible row */}
              <div className={styles.tagFiltersRow}>
                <span className={styles.filterLabel}>Filter:</span>
                <button
                  className={clsx(styles.tagChip, activeTags.length === 0 && styles.tagChipActive)}
                  onClick={() => { setActiveTags([]); setFiltersOpen(false); }}
                >
                  All
                </button>
                {/* Mobile-only toggle button */}
                <button
                  className={clsx(styles.mobileFilterToggle, filtersOpen && styles.mobileFilterToggleOpen)}
                  onClick={() => setFiltersOpen((o) => !o)}
                >
                  {!filtersOpen && activeTags.length === 1
                    ? activeTags[0]
                    : !filtersOpen && activeTags.length > 1
                      ? `Filters (${activeTags.length})`
                      : 'Filters'}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {/* Chip list — always visible on desktop, collapsible on mobile.
                  Tags are multi-select. Defaults to OR (any selected tag matches);
                  flip the "Match all" checkbox in the active-filters strip below
                  to switch to AND. */}
              <div className={clsx(styles.chipsArea, filtersOpen && styles.chipsAreaOpen)}>
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className={clsx(styles.tagChip, activeTags.includes(tag) && styles.tagChipActive)}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active-filters strip: summary of current selection, AND/OR toggle,
              and a one-click clear. Also the only place the active set is
              visible on mobile, where the chip list collapses behind "Filters". */}
          {activeTags.length > 0 && (
            <div className={styles.activeFilters}>
              <span className={styles.activeFiltersLabel}>{activeFiltersLabel}</span>
              <div className={styles.activeFilterChips}>
                {activeTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.activeFilterChip}
                    onClick={() => toggleTag(tag)}
                    aria-label={`Remove filter ${tag}`}
                  >
                    <span>{tag}</span>
                    <span className={styles.activeFilterRemove} aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
              {activeTags.length >= 2 && (
                <label className={styles.matchAllToggle}>
                  <input
                    type="checkbox"
                    checked={matchAll}
                    onChange={(e) => setMatchAll(e.target.checked)}
                  />
                  <span>Match all</span>
                </label>
              )}
              <button
                type="button"
                className={styles.clearAllBtn}
                onClick={clearAllTags}
              >
                Clear all
              </button>
            </div>
          )}

          <p className={styles.resultsCount}>
            {filtered.length === SCENARIOS.length
              ? `${SCENARIOS.length} scenarios`
              : `${filtered.length} of ${SCENARIOS.length} scenarios`}
          </p>

          <div className={styles.grid}>
            {filtered.length > 0 ? (
              filtered.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} />
              ))
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>No scenarios match your search</p>
                <p>Try a different keyword or clear the filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}
