import fs from 'fs';
import path from 'path';
import { Pact } from "@pact-foundation/pact";

export interface PactManagerConfig {
  uniqueIndex: number;
  basePort: number;
  consumer: string;
  providers: string[];
}

const LOG_DIR = 'logs';

/**
 * PactManager to simplify pact server management when working with
 * jest parallel tests.
 */
export class PactManager {
  readonly config: PactManagerConfig;
  runningServers: Array<Pact> = [];

  constructor(config: PactManagerConfig) {
    this.config = config;

    const dir = this.pactDir();

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
    for (const runningServer of this.runningServers) {
      try {
        await runningServer.verify();
      } finally {
        await runningServer.finalize();
      }
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
      log: path.resolve(
        process.cwd(),
        LOG_DIR,
        `manager${this.config.uniqueIndex}-mockserver-${provider}:${port}-integration.log`
      ),
      dir: this.pactDir(),
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

  private pactDir = () => path.resolve(process.cwd(), `pacts/manager${this.config.uniqueIndex}`);
}
