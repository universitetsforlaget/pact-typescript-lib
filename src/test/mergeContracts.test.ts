import fs from 'fs';

import * as mergeContracts from '../mergeContracts';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));

typeof fs.readFileSync

const mockReadFileSync: jest.MockInstance<string | undefined, any[]> = fs.readFileSync as any;
const mockReadDirSync: jest.MockInstance<string[] | undefined, [string]> = fs.readdirSync as any;

describe('mergeContracts', () => {
  it('scans the directory structur', () => {
    mockReadDirSync.mockImplementation((path) => {
      switch (path) {
        case './pacts':
          return ['manager0', 'wtf', 'manager123'];
        case './pacts/manager0':
          return ['foo', 'bar'];
        case './pacts/manager123':
          return ['bar', 'baz'];
      }
    });

    const pactsToBeMerged = mergeContracts.findPactsToBeMerged();

    expect(pactsToBeMerged).toEqual({
      foo: {
        fileName: 'foo',
        managerNames: ['manager0'],
      },
      bar: {
        fileName: 'bar',
        managerNames: ['manager0', 'manager123'],
      },
      baz: {
        fileName: 'baz',
        managerNames: ['manager123'],
      }
    });
  });

  it('merges pacts into one contract', () => {
    mockReadFileSync.mockImplementation((path, encoding) => {
      switch (path) {
        case './pacts/manager0/abc-def.json':
          return JSON.stringify({
            consumer: 'abc',
            provider: 'def',
            interactions: [{ foo: 'one' }],
            metadata: 'foo',
          });
        case './pacts/manager1/abc-def.json':
          return JSON.stringify({
            consumer: 'abc',
            provider: 'def',
            interactions: [{ bar: 'two' }],
            metadata: 'bar',
          })
      }
    });

    const contract = mergeContracts.mergeOnePact({
      fileName: 'abc-def.json',
      managerNames: ['manager0', 'manager1'],
    });

    expect(contract).toEqual({
      consumer: 'abc',
      provider: 'def',
      interactions: [{ foo: 'one' }, { bar: 'two' }],
      metadata: 'foo',
    });
  });
});
