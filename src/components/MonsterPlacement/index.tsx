import { useI18n } from 'i18n'
import type { useMonsterPlacement } from 'hooks/useMonsterPlacement'
import styles from './style.module.scss'

export default function MonsterPlacement({
  placement
}: {
  placement: ReturnType<typeof useMonsterPlacement>
}) {
  const { t } = useI18n()
  return (
    <>
      {placement.editing && placement.position && (
        <span
          className={styles.foot}
          aria-hidden="true"
          style={{
            left: placement.position.screen.x,
            top: placement.position.screen.y
          }}
        />
      )}
      <section className={styles.panel} aria-label={t('map.placement.title')}>
        <div className={styles.actions}>
          <button
            type="button"
            aria-pressed={placement.editing}
            onClick={() => placement.setEditing(!placement.editing)}
          >
            {t(
              placement.editing ? 'map.placement.done' : 'map.placement.title'
            )}
          </button>
          {placement.editing && (
            <>
              <output className={styles.coordinates}>
                X {placement.position?.map.x ?? '—'} · Y{' '}
                {placement.position?.map.y ?? '—'}
              </output>
              <button
                type="button"
                disabled={!placement.position}
                onClick={placement.copy}
              >
                {t(
                  placement.copyState === 'copied'
                    ? 'map.placement.copied'
                    : 'map.placement.copy'
                )}
              </button>
              <button type="button" onClick={placement.reset}>
                {t('map.placement.reset')}
              </button>
            </>
          )}
        </div>
        {placement.editing && <p>{t('map.placement.hint')}</p>}
        {placement.editing && placement.copyState === 'error' && (
          <>
            <p role="status">{t('map.placement.copyFallback')}</p>
            <textarea
              readOnly
              value={placement.copyText}
              aria-label={t('map.placement.copy')}
              onFocus={(event) => event.currentTarget.select()}
            />
          </>
        )}
      </section>
    </>
  )
}
