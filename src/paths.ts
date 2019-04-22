import path from 'path';

export const PACT_DIR = 'pacts';
export const LOG_DIR = 'logs';

const resolve = (relativePath: string)  => path.resolve(process.cwd(), relativePath);

export const pactDir = () => resolve(PACT_DIR);
export const managerPactDir = (uniqueIndex: number) => resolve(`${PACT_DIR}/manager${uniqueIndex}`);
export const mergedPactDir = () => resolve(`${PACT_DIR}/merged`);

export const logFilePath = (logFileName: string) => resolve(`${LOG_DIR}/${logFileName}`);
