import * as vscode from 'vscode'
import * as childProcess from 'child_process'
import * as path from 'path'
import { promisify } from 'util'

const exec = promisify(childProcess.exec)

interface Package {
  filePath: string
  getPackageName(): string | undefined
  getRepositoryURL(): Promise<string | undefined>
}

class NpmPackage implements Package {
  constructor(public filePath: string) {}

  getPackageName(): string | undefined {
    const parts = this.filePath.split('/node_modules/')[1]?.split(path.sep)
    if (!parts || !parts[0] || !parts[1]) {
      return
    }
    return parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
  }

  async getRepositoryURL(): Promise<string | undefined> {
    const packageName = this.getPackageName()
    if (!packageName) {
      return
    }

    const { stdout } = await exec(`npm view ${packageName} repository.url`)
    return stdout.trim().split('+', 2)[1] || undefined
  }
}

class GemPackage implements Package {
  constructor(public filePath: string) {}

  getPackageName(): string | undefined {
    const parts = this.filePath.split('/gems/')
    if (!parts[1]) {
      return
    }
    const packageName = parts[1].split('/')[0]
    if (!packageName) {
      return
    }
    const packageNameParts = packageName.split('-')
    return packageNameParts.slice(0, packageNameParts.length - 1).join('-')
  }

  async getRepositoryURL(): Promise<string | undefined> {
    const packageName = this.getPackageName()
    if (!packageName) {
      return
    }

    try {
      const { stdout } = await exec(
        `gem specification -r ${packageName} metadata | grep source_code_uri`
      )
      const sourceCodeURI = stdout.trim()
      if (!sourceCodeURI) {
        return
      }
      const repositoryURL = sourceCodeURI.split(' ', 2)[1]
      return repositoryURL
    } catch {}
  }
}

const createPackage = (filePath: string): Package | undefined => {
  if (filePath.includes('/node_modules/')) {
    return new NpmPackage(filePath)
  } else if (filePath.includes('/gems/')) {
    return new GemPackage(filePath)
  }
}

export const getRepositoryURL = async (
  filePath: string
): Promise<string | undefined> => {
  const pkg = createPackage(filePath)
  return pkg?.getRepositoryURL()
}
