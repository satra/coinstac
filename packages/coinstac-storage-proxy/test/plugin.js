'use strict';

const tape = require('tape');
const hapi = require('hapi');
const path = require('path');
const plugin = require(path.join(process.cwd(), 'src', 'index.js'));

tape('COINSTAC-storage-proxy: plugin', (t) => {
  t.plan(2);
  t.equals(typeof plugin.attributes.name, 'string', 'has name attribute');
  t.equals(typeof plugin, 'function', 'plugin is a function');

  const server = new hapi.Server();
  server.connection();
  const mockOptions = { targetBaseUrl: 'http://localhost:5984' };
  server.register(
    [
      { register: plugin, options: mockOptions },
      require('h2o2')
    ],
        (err) => {
          if (err) {
            t.fail('failed to load plugin');
            t.comment('err.message');
            return;
          }
        }
    );
});
