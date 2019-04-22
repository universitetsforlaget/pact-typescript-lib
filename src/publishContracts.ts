import pact from '@pact-foundation/pact-node';

import { mergeAllPacts } from './mergeContracts';
import { mergedPactDir } from './paths';

interface Options {
  consumerVersion: string;
}

export const mergeAndPublishContracts = async (
  options: Options
): Promise<void> => {
  console.log('merging contracts from PactManagers...');
  mergeAllPacts();
  await pact.publishPacts({
    pactFilesOrDirs: [mergedPactDir()],
    pactBroker: 'https://pactbroker.juridika.no',
    tags: ['prod'],
    consumerVersion: options.consumerVersion,
  });
}
