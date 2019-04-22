import fs from 'fs';

interface ConsumerContract {
  consumer: any;
  provider: any;
  interactions: any[];
  metadata: any;
}

interface PactToBeMerged {
  fileName: string;
  managerNames: string[];
};

interface PactsToBeMerged {
  [filename: string]: PactToBeMerged;
}

const findPactsToBeMergedFromManager = (
  managerName: string,
  oldPactsToBeMerged: PactsToBeMerged,
): PactsToBeMerged => {
  return fs.readdirSync(`./pacts/${managerName}`)
    .reduce(
      (pactsToBeMerged: PactsToBeMerged, pactname) => {
        const oldManagerNames = (pactsToBeMerged[pactname] && pactsToBeMerged[pactname].managerNames) || [];
        return {
          ...pactsToBeMerged,
          [pactname]: {
            fileName: pactname,
            managerNames: [...oldManagerNames, managerName],
          }
        };
      },
      oldPactsToBeMerged
  );
};

export const findPactsToBeMerged = (): PactsToBeMerged => {
  return fs.readdirSync('./pacts')
    .reduce(
      (pactsToBeMerged: PactsToBeMerged, dirname) => {
        if (dirname.startsWith('manager')) {
          return findPactsToBeMergedFromManager(dirname, pactsToBeMerged);
        }
        return pactsToBeMerged;
      },
      {}
    );
};

export const mergeOnePact = (
  pactToBeMerged: PactToBeMerged
): ConsumerContract => {
  const contracts = pactToBeMerged.managerNames.map(managerName => {
    const contents = fs.readFileSync(`./pacts/${managerName}/${pactToBeMerged.fileName}`, 'utf8');
    return JSON.parse(contents) as ConsumerContract;
  });

  const firstContract = contracts[0];

  const allInteractions = contracts
    .map(contract => contract.interactions)
    .reduce((a, b) => a.concat(b));

  return {
    ...firstContract,
    interactions: allInteractions,
  };
}

export const mergeAllPacts = () => {
  const pactsToBeMerged = findPactsToBeMerged();

  try {
    fs.mkdirSync('./pacts');
  } catch (e) {
  }
  try {
    fs.mkdirSync('./pacts/merged');
  } catch (e) {
  }

  for (const pactfilename of Object.keys(pactsToBeMerged)) {
    const pactToBeMerged = pactsToBeMerged[pactfilename];
    const contract = mergeOnePact(pactToBeMerged);

    fs.writeFileSync(`./pacts/merged/${pactfilename}`, JSON.stringify(contract, null, 2));
  }
};
