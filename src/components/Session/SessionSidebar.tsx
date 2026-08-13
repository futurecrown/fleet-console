import { useTranslations } from 'next-intl'

export function SessionSidebar({
  projects,
  project,
  setProject,
  sessionInfo,
  mitStand,
  setMitStand,
  roles,
  model,
  setModel,
  MODELS,
  loading,
  running,
  start,
  cancel,
  clear,
}: any) {
  const t = useTranslations()

  return (
    <aside
      style={{
        width: 280,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-neutral-300)' }}>
          {t('project.title')}
        </h2>
        <select
          className="input"
          value={project}
          disabled={running}
          onChange={(e) => setProject(e.target.value)}
        >
          <option value="">{t('project.none')}</option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.copy ? ` (${p.copy})` : ''}
            </option>
          ))}
        </select>
        {sessionInfo && (
          <div style={{ fontSize: 10, color: 'var(--color-neutral-500)', lineHeight: 1.4 }}>
            <div>{t('project.directory')}:</div>
            <div
              className="mono"
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={sessionInfo.pwd}
            >
              {sessionInfo.pwd}
            </div>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="chip"
                data-on={mitStand}
                onClick={() => setMitStand(!mitStand)}
                disabled={running}
              >
                {t('project.loadState')}
              </button>
            </div>
          </div>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-neutral-300)' }}>
            {t('roles.title')}
          </h2>
          <span style={{ fontSize: 10, color: 'var(--color-neutral-500)' }}>{roles.length}</span>
        </div>
        {roles.length === 0 ? (
          <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)', fontStyle: 'italic' }}>
            {t('roles.noRolesFound')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {roles.map((r: any) => (
              <div key={r.name} className="chip" data-on={true}>
                {r.name.replace('-', ' ')}
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-neutral-300)' }}>
          {t('model.title')}
        </h2>
        <select
          className="input"
          value={model}
          disabled={running}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="">{t('model.auto')}</option>
          <optgroup label={t('model.forAll')}>
            {MODELS.map((m: any) => (
              <option key={m.id} value={m.id}>
                {t('model.allTo')} {m.label}
              </option>
            ))}
          </optgroup>
        </select>
      </section>

      <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
        <button
          className={`btn ${running ? 'btn-secondary' : 'btn-primary'}`}
          style={{ flex: 1 }}
          onClick={running ? cancel : start}
          disabled={loading || !project}
        >
          {running ? t('session.cancel') : t('session.start')}
        </button>
        {!running && (
          <button className="btn btn-ghost btn-icon" onClick={clear} title={t('session.clear')}>
            <i className="ph ph-trash" />
          </button>
        )}
      </div>
    </aside>
  )
}
