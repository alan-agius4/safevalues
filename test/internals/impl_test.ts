/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {createHtml, unwrapHtmlAsString} from '../../src/internals/html_impl';
import {createResourceUrl, unwrapResourceUrlAsString} from '../../src/internals/resource_url_impl';
import {createScript, unwrapScriptAsString} from '../../src/internals/script_impl';

interface Impl {
  name: string;
  create: (str: string) => {};
  // Functions are contravariant in regards to their param types so unknown does
  // not work here.
  // tslint:disable-next-line:no-any
  unwrap: (value: any) => string;
}

const IMPLEMENTATIONS: Impl[] = [
  {
    name: 'TrustedHTML',
    create: createHtml,
    unwrap: unwrapHtmlAsString,
  },
  {
    name: 'TrustedScript',
    create: createScript,
    unwrap: unwrapScriptAsString,
  },
  {
    name: 'TrustedScriptURL',
    create: createResourceUrl,
    unwrap: unwrapResourceUrlAsString,
  },
];

describe('safevalues implementation', () => {
  for (const impl of IMPLEMENTATIONS) {
    describe(`of ${impl.name}`, () => {
      it('stringifies to its inner value', () => {
        const value = impl.create('');
        expect(value.toString()).toBe('');
      });

      it('prevent indirect use of safe constructor', () => {
        const value = impl.create('');
        expect(() => value.constructor('danger')).toThrowError();
        expect(() => value.constructor('danger', null)).toThrowError();
        expect(() => value.constructor('danger', {})).toThrowError();
        expect(() => value.constructor('danger', 'secret')).toThrowError();
      });

      describe('unwrappers', () => {
        it('throw when passed a random object', () => {
          const fakeObj = {
            toString() {
              return 'danger';
            }
          };
          expect(() => impl.unwrap(fakeObj)).toThrowError();
        });

        it('is not affected if the `toString` method is overridden', () => {
          const customToString = impl.create('');
          customToString.toString = () => 'danger';
          expect(impl.unwrap(customToString)).toBe('');
        });

        for (const impl2 of IMPLEMENTATIONS) {
          if (impl.name !== impl2.name) {
            it(`throws when passed a ${impl2.name} value`, () => {
              const value = impl2.create('');
              expect(() => impl.unwrap(value)).toThrowError();
            });
          }
        }
      });
    });
  }
});