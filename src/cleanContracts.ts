import rimraf from 'rimraf';

export const cleanContracts = async () => {
  await Promise.all([
    new Promise(resolve => rimraf('./pacts', {}, resolve)),
    new Promise(resolve => rimraf('./logs', {}, resolve)),
  ]);
};
