'use strict';

require('../helpers/boot');

const ComputationRegistry =
  require('../../src/services/classes/computation-registry');
const computationRegistryFactory =
  require('../../src/services/computation-registry-factory');
const DBRegistry = require('../../src/services/classes/db-registry');
const fs = require('fs');
const helpers = require('../helpers/computation-registry-helpers');
const mockDecentralizedComputations =
  require('../mocks/decentralized-computations.json');
const path = require('path');
const sinon = require('sinon');
const tape = require('tape');
const testDirectory = path.join(__dirname, '..', '..', '.tmp');

let addStub;

function getValidLocalOptions() {
  return {
    dbRegistry: new DBRegistry({
      localStores: ['computations'],
      pouchConfig: {
        adapter: 'memory',
      },
      remote: {
        db: 'https://localhost:1234',
      },
    }),
    isLocal: true,
    path: testDirectory,
  };
}

tape('setup', t => {
  addStub = sinon
    .stub(ComputationRegistry.prototype, 'add')
    .returns(Promise.resolve());

  t.end();
});

tape('configuration errors', t => {
  t.plan(4);

  computationRegistryFactory()
    .then(() => t.fail('resolves without args'))
    .catch(() => t.pass('rejects without args'));

  computationRegistryFactory({})
    .then(() => t.fail('resolves without computation path'))
    .catch(() => t.pass('rejects without computation path'));

  computationRegistryFactory({
    isLocal: true,
    path: testDirectory,
  })
    .then(() => t.fail('resolves without DB registry'))
    .catch(() => t.pass('rejects without DB registry'));

  computationRegistryFactory({
    dbRegistry: {},
    isLocal: true,
    path: testDirectory,
  })
    .then(() => t.fail('resolves with bad DB registry'))
    .catch(() => t.pass('rejects with bad DB registry'));
});

tape('returns ComputationRegistry instance', t => {
  t.plan(3);

  computationRegistryFactory({
    path: testDirectory,
    registry: [],
  })
    .then(computationRegistry => {
      t.ok(
        computationRegistry &&
        computationRegistry instanceof ComputationRegistry,
        'returns a non-local registry instance'
      );

      return computationRegistryFactory(getValidLocalOptions());
    })
    .then(computationRegistry => {
      t.ok(
        computationRegistry &&
        computationRegistry instanceof ComputationRegistry,
        'returns a local registry instance'
      );
      t.equal(
        computationRegistry.registry.length,
        0,
        'sets empty internal registry'
      );
    })
    .catch(t.end);
});

tape('passes custom registry', t => {
  t.plan(1);

  computationRegistryFactory({
    path: testDirectory,
    registry: mockDecentralizedComputations,
  })
    .then(computationRegistry => {
      t.equal(
        computationRegistry.registry,
        mockDecentralizedComputations
      );
    })
    .catch(t.end);
});

tape('sets path', t => {
  t.plan(1);

  const customPath = path.join(
    __dirname, '..', 'mocks', 'decentralized-computations.json'
  );

  computationRegistryFactory({ path: customPath })
    .then(computationRegistry => {
      t.equal(
        computationRegistry.path,
        customPath,
        'sets custom path'
      );
    })
    .catch(t.end);
});

tape('local computation registry fetches computations from source', t => {
  t.plan(4);

  const options = getValidLocalOptions();
  const name = 'the-ravens';
  const spy = sinon.spy();
  const version = '2.0.0';

  const dbGetStub = sinon.stub(options.dbRegistry, 'get');
  const returnDocs = mockDecentralizedComputations.reduce((all, c) => {
    if (c.name !== name) {
      return all;
    }

    return all.concat(c.tags.filter(t => t === version).map(version => {
      return {
        name: c.name,
        version,
        url: c.url,
      };
    }));
  }, []);

  dbGetStub.returns({
    find: () => {
      spy.apply(spy, arguments);

      return Promise.resolve(returnDocs);
    },
  });

  computationRegistryFactory(options)
    .then(computationRegistry => {
      t.ok(dbGetStub.calledWith('computations'), 'gets computations DB');
      return computationRegistry.add(name, version)
      .then(() => {
        t.equal(
          spy.callCount,
          1,
          'gets all documents from computations DB'
        );
        t.deepEqual(
          computationRegistry.registry[0],
          {
            name,
            tags: [version],
            url: returnDocs[0].url,
          },
          'sets computations docs to internal registry'
        );
        t.deepEqual(
          addStub.lastCall.args,
          [name, version],
          'proxies to ComputationRegistry#add'
        );
      });
    })
    .catch(t.end)
    .then(() => dbGetStub.restore());
});

tape('local computation registry mutates whitelist', t => {
  t.plan(2);

  // Prevent network calls by stubbing 'add':
  const options = getValidLocalOptions();
  const name = 'the-ravens';
  const version = '2.0.0';
  const url = 'https://github.com/MRN-Code/the-ravens';

  const dbGetStub = sinon.stub(options.dbRegistry, 'get');
  const registry = [{
    name,
    tags: ['1.0.0', '3.0.0'],
    url,
  }];

  dbGetStub.returns({
    find: () => Promise.resolve([{
      name,
      version,
      url,
    }]),
  });

  options.registry = registry;

  computationRegistryFactory(options)
    .then(computationRegistry => Promise.all([
      Promise.resolve(computationRegistry),
      computationRegistry.add(name, version),
    ]))
    .then(responses => {
      const instance = responses[0];
      t.equal(instance.registry, registry, 'keeps passed registry');
      t.ok(
        instance.registry[0].tags.indexOf(version) !== -1,
        'adds version to existing registry item'
      );
    })
    .catch(t.end)
    .then(() => dbGetStub.restore());
});

tape('local computation registry handles not-found computation', t => {
  t.plan(1);

  const options = getValidLocalOptions();
  const name = 'the-ravens';
  const version = '2.0.0';

  const dbGetStub = sinon.stub(options.dbRegistry, 'get');

  dbGetStub.returns({
    find: () => Promise.resolve({ docs: [] }),
  });

  computationRegistryFactory(options)
    .then(computationRegistry => computationRegistry.add(name, version))
    .then(() => t.fail('expected not-found error'))
    .catch(() => t.pass('rejects with not-found error'))
    .then(() => dbGetStub.restore());
});

tape('remote computation registry retrieves all computations', t => {
  const expected = [{
    name: 'the-ravens',
    version: '1.0.0',
  }, {
    name: 'the-ravens',
    version: '2.0.0',
  }, {
    name: 'the-ravens',
    version: '3.0.0',
  }, {
    name: 'owl-pillows',
    version: '0.5.0',
  }, {
    name: 'a-small-bag',
    version: '1.0.0-beta',
  }];

  t.plan(1);

  computationRegistryFactory({
    path: testDirectory,
    registry: mockDecentralizedComputations,
  })
    .then(computationRegistry => {
      t.ok(
        expected.every(e => addStub.calledWithExactly(e.name, e.version)),
        'adds every decentralized computation to registry'
      );
    })
    .catch(t.end);
});

tape('teardown', t => {
  addStub.restore();
  t.end();
});
