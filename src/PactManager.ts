import fs from 'fs';
import { Pact } from "@pact-foundation/pact";

import { logFilePath, managerPactDir } from './paths';

export interface PactManagerConfig {
  uniqueIndex: number;
  basePort: number;
  consumer: string;
  providers: string[];
}

/**
 * PactManager to simplify pact server management when working with
 * jest parallel tests.
 */
export class PactManager {
  readonly config: PactManagerConfig;
  runningServers: Array<Pact> = [];

  constructor(config: PactManagerConfig) {
    this.config = config;

    const dir = managerPactDir(config.uniqueIndex);

    if (fs.existsSync(dir)) {
      throw new Error(`
        Path ${dir} already exists. Check that uniqueIndex passed to PactManager is in fact a unique index,
        and check that cleanContracts() has been executed before test runs.
      `);
    }
  }

  protected startPactServer = async (
    provider: string
  ): Promise<Pact> => {
    const pactServer = this.createPactServer(provider);

    this.runningServers.push(pactServer);
    await pactServer.setup();

    return pactServer;
  };

  // Must run this function after each use of a manager in a test
  finalize = async (): Promise<void> => {
    let error;
    for (const runningServer of this.runningServers) {
      try {
        await runningServer.verify();
      } catch (err) {
        if (!error) {
          error = err;
        }
      } finally {
        await runningServer.finalize();
      }
    }
    if (error) {
      throw error;
    }
  };

  private createPactServer = (
    provider: string,
  ): Pact => {
    const port = this.allocatePort(provider);

    return new Pact({
      consumer: this.config.consumer,
      provider,
      port,
      host: 'localhost',
      log: logFilePath(`manager${this.config.uniqueIndex}-mockserver-${provider}:${port}-integration.log`),
      dir: managerPactDir(this.config.uniqueIndex),
      logLevel: 'error',
      spec: 3,
      pactfileWriteMode: 'overwrite',
    });
  }

  private allocatePort = (
    provider: string,
  ): number => {
    const indexOfConfig = this.config.providers
      .findIndex(p => p === provider);
    if (indexOfConfig < 0) {
      throw new Error(`Did not find provider "${provider}"`);
    }

    const totalProviders = this.config.providers.length;

    return this.config.basePort + (this.config.uniqueIndex * totalProviders) + indexOfConfig;
  }
}
