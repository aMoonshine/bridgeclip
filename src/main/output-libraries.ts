import { loadSettings } from './settings-store'
import { isWithinDirectory } from './security'

export function outputLibraries(): string[] {
  const settings = loadSettings()
  return [...new Set([settings.outputDirectory, ...settings.outputLibraries])]
}

/** Only roots selected through the main process folder picker are retained. */
export function mediaLibrary(path: string): string {
  return outputLibraries().find(root => isWithinDirectory(path, root)) ?? loadSettings().outputDirectory
}
