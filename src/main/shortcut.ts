import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { app } from 'electron';

// ---------------------------------------------------------------------------
// Desktop shortcut creation for Windows
// ---------------------------------------------------------------------------

interface ShortcutResult {
  success: boolean;
  path: string;
  message: string;
}

/**
 * Create a desktop shortcut to launch LocalAI Nexus.
 *
 * Strategy (Windows):
 *  1. If a built executable exists in `release/`, point the shortcut at it.
 *  2. Otherwise, create a `start-agentflow.bat` in the project root that
 *     runs `npm run dev`, then point the shortcut at that .bat file.
 */
export async function createDesktopShortcut(): Promise<ShortcutResult> {
  if (os.platform() !== 'win32') {
    return {
      success: false,
      path: '',
      message: 'Desktop shortcut creation is currently supported only on Windows.',
    };
  }

  try {
    const desktopDir = path.join(os.homedir(), 'Desktop');
    const projectRoot = app.isPackaged
      ? path.dirname(app.getPath('exe'))
      : process.cwd();

    // ------------------------------------------------------------------
    // Determine the target executable / script
    // ------------------------------------------------------------------
    let targetPath: string;
    let description: string;

    // Check for a built release executable
    const releaseDir = path.join(projectRoot, 'release');
    const winUnpackedDir = path.join(releaseDir, 'win-unpacked');
    let exePath: string | null = null;

    try {
      const releaseEntries = await fs.readdir(releaseDir);
      const exeEntry = releaseEntries.find((e) => e.endsWith('.exe'));
      if (exeEntry) {
        exePath = path.join(releaseDir, exeEntry);
      }
    } catch {
      // release dir does not exist
    }

    if (!exePath) {
      try {
        const unpackedEntries = await fs.readdir(winUnpackedDir);
        const exeEntry = unpackedEntries.find((e) => e.endsWith('.exe'));
        if (exeEntry) {
          exePath = path.join(winUnpackedDir, exeEntry);
        }
      } catch {
        // win-unpacked does not exist
      }
    }

    if (exePath) {
      targetPath = exePath;
      description = 'LocalAI Nexus';
    } else {
      // Fallback: create a .bat launcher in the project root
      const batPath = path.join(projectRoot, 'start-agentflow.bat');
      const batContent = [
        '@echo off',
        'title LocalAI Nexus',
        `cd /d "${projectRoot}"`,
        'echo Starting LocalAI Nexus...',
        'call npm run dev',
        'pause',
      ].join('\r\n');

      await fs.writeFile(batPath, batContent, 'utf-8');
      targetPath = batPath;
      description = 'LocalAI Nexus (dev)';
    }

    // ------------------------------------------------------------------
    // Create the .lnk shortcut using a PowerShell script
    // ------------------------------------------------------------------
    const shortcutPath = path.join(desktopDir, 'LocalAI Nexus.lnk');
    const psScript = [
      '$WshShell = New-Object -ComObject WScript.Shell',
      `$Shortcut = $WshShell.CreateShortcut('${shortcutPath.replace(/'/g, "''")}')`,
      `$Shortcut.TargetPath = '${targetPath.replace(/'/g, "''")}'`,
      `$Shortcut.WorkingDirectory = '${projectRoot.replace(/'/g, "''")}'`,
      `$Shortcut.Description = '${description}'`,
      '$Shortcut.Save()',
    ].join('; ');

    // Write a temporary PowerShell script and execute it
    const tmpPsPath = path.join(projectRoot, '.localai-nexus-create-shortcut.ps1');
    await fs.writeFile(tmpPsPath, psScript, 'utf-8');

    const { execFile } = await import('child_process');
    await new Promise<void>((resolve, reject) => {
      execFile(
        'powershell.exe',
        ['-ExecutionPolicy', 'Bypass', '-File', tmpPsPath],
        { timeout: 30000 },
        (error) => {
          // Clean up temp script
          fs.unlink(tmpPsPath).catch(() => {});
          if (error) reject(error);
          else resolve();
        },
      );
    });

    return {
      success: true,
      path: shortcutPath,
      message: `Shortcut created at: ${shortcutPath}`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      path: '',
      message: `Failed to create shortcut: ${(err as Error).message}`,
    };
  }
}
