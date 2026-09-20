import { useLocalStorageState } from '../../../shared/hooks/useLocalStorageState'

export type ViewMode = 'list' | 'grid'

const isViewMode = (value: unknown): value is ViewMode => value === 'list' || value === 'grid'
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

export function useFileBrowserPreferences() {
  const [viewMode, setViewMode] = useLocalStorageState<ViewMode>(
    'f24-file-browser-view',
    'list',
    isViewMode,
  )
  const [showFileExtensions, setShowFileExtensions] = useLocalStorageState<boolean>(
    'f24-show-file-extensions',
    true,
    isBoolean,
  )

  return {
    setShowFileExtensions,
    setViewMode,
    showFileExtensions,
    viewMode,
  }
}
