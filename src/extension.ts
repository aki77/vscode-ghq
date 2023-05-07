import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import {promisify} from 'util';
import * as path from 'path';

const exec = promisify(childProcess.exec);

const getRoot = async (): Promise<string | undefined> => {
  try {
    const {stdout} = await exec('ghq root');
    return stdout.trim();
  } catch (error) {
  }
};

const getRepositories = async (): Promise<readonly string[]> => {
  const {stdout} = await exec('ghq list');
  return stdout.split('\n').filter((x) => x);
};

const selectRepository = async (): Promise<vscode.Uri | undefined> => {
  const repositories = await getRepositories();
  const repository = await vscode.window.showQuickPick(repositories);
  if (!repository) {
    return;
  };

  const ghqRoot = await getRoot();
  if (!ghqRoot) {
    return;
  }

  const repositoryPath = path.join(ghqRoot, repository);
  return vscode.Uri.file(repositoryPath);
};

const open = async (newWindow = false) => {
  const uri = await selectRepository();
  if (!uri) {
    return;
  }

  return vscode.commands.executeCommand('vscode.openFolder', uri, newWindow);
};

const openInBrowser = async () => {
  const uri = await selectRepository();
  if (!uri) {
    return;
  }

  const webUri = 'https://' + uri.path.split('/').slice(-3).join('/');
  vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(webUri));
};

const addToWorkSpace = async () => {
  const uri = await selectRepository();
  if (!uri) {
    return;
  }

  const position = vscode.workspace.workspaceFolders?.length ?? 0;
  vscode.workspace.updateWorkspaceFolders(position, null, { uri });
};

export async function activate(context: vscode.ExtensionContext) {
  if (!await getRoot()) {
    vscode.window.showWarningMessage('ghq is not installed.');
    return;
  }

  context.subscriptions.push(vscode.commands.registerCommand('ghq.open', () => {
    return open();
  }));
  context.subscriptions.push(vscode.commands.registerCommand('ghq.openInNewWindow', () => {
    return open(true);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('ghq.openInBrowser', () => {
    return openInBrowser();
  }));
  context.subscriptions.push(vscode.commands.registerCommand('ghq.addToWorkSpace', () => {
    return addToWorkSpace();
  }));
}
// This method is called when your extension is deactivated
export function deactivate() {}
