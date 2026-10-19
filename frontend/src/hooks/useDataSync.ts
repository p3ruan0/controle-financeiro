import { useEffect, useState, useRef } from 'react';
import { dataSync, SyncEntity } from '../services/dataSync';

/**
 * Hook to reactively subscribe to changes in one or more DataSync entities.
 * Returns an auto-incrementing version number that triggers re-renders,
 * and optionally calls an onSync callback.
 */
export function useDataSync(
  entities: SyncEntity | SyncEntity[],
  onSync?: (affected: Set<SyncEntity>) => void
): number {
  const [version, setVersion] = useState(0);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    const unsubscribe = dataSync.subscribe(entities, (affected) => {
      setVersion(v => v + 1);
      if (onSyncRef.current) {
        onSyncRef.current(affected);
      }
    });

    return () => unsubscribe();
  }, [Array.isArray(entities) ? entities.join(',') : entities]);

  return version;
}
