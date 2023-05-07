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

const getFilesByRepository = async (repository: string): Promise<readonly File[]> => {
  const rootPath = await getRoot();
  if (!rootPath) {
    return [];
  }

  const repositoryPath = path.join(rootPath, repository);
  const {stdout} = await exec('git ls-files', { cwd: repositoryPath });
  return stdout.split('\n').filter((x) => x).map((filePath) => ({
    label: path.basename(filePath),
    description: filePath,
    path: path.join(repositoryPath, filePath),
  }));
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
  return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(webUri));
};

const addToWorkSpace = async () => {
  const uri = await selectRepository();
  if (!uri) {
    return;
  }

  const position = vscode.workspace.workspaceFolders?.length ?? 0;
  vscode.workspace.updateWorkspaceFolders(position, null, { uri });
};

type Repository = {
  label: string;
};

type File = {
  label: string;
  description: string;
  path: string;
};

const openFileInCurrentWindow = async () => {
  const quickPick = vscode.window.createQuickPick<Repository | File>();

  quickPick.onDidAccept(async () => {
    const selectedItem = quickPick.selectedItems[0];
    if (!selectedItem) {
      return;
    }

    if (quickPick.step === 1) {
      quickPick.busy = true;
      quickPick.value = "";
      quickPick.step = 2;
      quickPick.placeholder = "Select a File";
      quickPick.items = await getFilesByRepository(selectedItem.label);
      quickPick.matchOnDescription = true;
      quickPick.busy = false;
    } else {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse((selectedItem as File).path));
    }
  });

  quickPick.totalSteps = 2;
  quickPick.busy = true;
  quickPick.value = "";
  quickPick.placeholder = "Select a Repository";
  quickPick.step = 1;
  quickPick.show();
  quickPick.items = (await getRepositories()).map((x) => ({ label: x }));
  quickPick.busy = false;
};

export async function activate(context: vscode.ExtensionContext) {
  if (!await getRoot()) {
    vscode.window.showWarningMessage('ghq is not installed.');
    return;
  }

  context.subscriptions.push(vscode.commands.registerCommand('ghq.open', async () => {
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
  context.subscriptions.push(vscode.commands.registerCommand('ghq.openFileInCurrentWindow', () => {
    return openFileInCurrentWindow();
  }));
}
// This method is called when your extension is deactivated
export function deactivate() {}
