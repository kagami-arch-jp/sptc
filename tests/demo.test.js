const {executeSptcFileEx, includeJsFile} = require('../engine');

describe('Demo Samples', () => {
  describe('01-basic.s', () => {
    it('should output basic template with variables', async () => {
      const result = await executeSptcFileEx('./demo/01-basic.s', {});
      expect(result).toContain('Hello, World!');
      expect(result).toContain('Current time:');
    });
  });

  describe('03-include-js.s', () => {
    it('should include js module and use its methods', async () => {
      const result = await executeSptcFileEx('./demo/03-include-js.s', {});
      expect(result).toContain('Result: 30'); // add(10, 20)
      expect(result).toContain('Random:');
      expect(result).toContain('Sub: 2'); // sub(5, 3)
      expect(result).toContain('Mul: 15'); // mul(5, 3)
    });

    it('should export all methods from include_js', async () => {
      const vm = require('vm');
      const fs = require('fs');
      const path = require('path');

      const code = fs.readFileSync('./demo/utils.js', 'utf8');
      const script = new vm.Script(code + ';\n Symbol()[0]=_=>0');
      const ctx = { exports: {}, module: { exports: {} } };
      script.runInNewContext(ctx);

      const utils = Object.assign(ctx, ctx.module.exports, ctx.exports);
      expect(typeof utils.add).toBe('function');
      expect(typeof utils.sub).toBe('function');
      expect(typeof utils.mul).toBe('function');
      expect(typeof utils.random).toBe('function');
      expect(typeof utils.greet).toBe('function');

      expect(utils.add(1, 2)).toBe(3);
      expect(utils.sub(5, 3)).toBe(2);
      expect(utils.mul(3, 4)).toBe(12);
      expect(utils.greet('Test')).toBe('Hello, Test!');
    });
  });

  describe('04-async-default.s', () => {
    it('should return response immediately without waiting for async', async () => {
      const result = await executeSptcFileEx('./demo/04-async-default.s', {});
      expect(result).toContain('Start...');
      expect(result).toContain('End - response sent immediately');
    }, 500);
  });

  describe('05-async-sync-push.s', () => {
    it('should wait for Sync.Push Promise before sending response', async () => {
      const result = await executeSptcFileEx('./demo/05-async-sync-push.s', {});
      expect(result).toContain('Async task completed after 2 seconds');
      expect(result).toContain('Start...');
    }, 5000);
  });

  describe('06-async-lock.s', () => {
    it('should wait for release() before sending response', async () => {
      const result = await executeSptcFileEx('./demo/06-async-lock.s', {});
      expect(result).toContain('Wait for async task');
      expect(result).toContain('Done! Response sent after async task');
    }, 5000);
  });

  describe('07-include-module.s', () => {
    it('should include module and access exports', async () => {
      const result = await executeSptcFileEx('./demo/07-include-module.s', {});
      expect(result).toContain('Loaded module with count: 2');
      expect(result).toContain('Bob');
    });
  });

  describe('08-context.s', () => {
    it('should access context variables', async () => {
      const result = await executeSptcFileEx('./demo/08-context.s', {
        $_PATHNAME: '/test',
        $_QUERY: { foo: 'bar' },
        $_REQUEST_FILE: { fullname: '/test/full/path', pathname: '/test' },
        $_WORKDIR: '/test/workdir',
        $_RAW_REQUEST: { headers: {} },
      }, {
        __DEV__: true,
      });
      expect(result).toContain('Request URL:');
      expect(result).toContain('Query:');
    });
  });

  describe('09-response.s', () => {
    it('should set response status and headers', async () => {
      const result = await executeSptcFileEx('./demo/09-response.s', {
        setStatus: (code, msg) => {},
        setResponseHeaders: (headers) => {},
      }, {
        __DEV__: true,
      });
      expect(result).toContain('"status":"success"');
      expect(result).toContain('"message":"Hello World"');
    });
  });

  describe('10-router.s', () => {
    const mockHttpPayload = {
      $_PATHNAME: '/index',
      $_QUERY: {},
      setStatus: (code, msg) => {},
      setResponseHeaders: (headers) => {},
    };

    it('should route to index page', async () => {
      const result = await executeSptcFileEx('./demo/10-router.s', {
        ...mockHttpPayload,
        $_PATHNAME: '/index',
      }, {
        __DEV__: true,
      });
      expect(result).toContain('Welcome to Home');
    });

    it('should route to about page', async () => {
      const result = await executeSptcFileEx('./demo/10-router.s', {
        ...mockHttpPayload,
        $_PATHNAME: '/about',
      }, {
        __DEV__: true,
      });
      expect(result).toContain('About Page');
    });

    it('should route to api', async () => {
      const result = await executeSptcFileEx('./demo/10-router.s', {
        ...mockHttpPayload,
        $_PATHNAME: '/api/users',
      }, {
        __DEV__: true,
      });
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
    });

    it('should return 404 for unknown path', async () => {
      const result = await executeSptcFileEx('./demo/10-router.s', {
        ...mockHttpPayload,
        $_PATHNAME: '/unknown',
      }, {
        __DEV__: true,
      });
      expect(result).toContain('404');
    });
  });

  describe('11-defer.s', () => {
    it('should execute defer callback after response', async () => {
      const result = await executeSptcFileEx('./demo/11-defer.s', {}, {
        __DEV__: true,
      });
      expect(result).toContain('Processing');
      expect(result).toContain('Response sent');
    });
  });

  describe('12-macro.s', () => {
    it('should process macro directives', async () => {
      const result = await executeSptcFileEx('./demo/12-macro.s', {}, {
        __DEV__: true,
      });
      expect(result).toContain('Macro Preprocessing Demo');
      expect(result).toContain('Is Production: false');
    });
  });
});