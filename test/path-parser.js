/**
 *  @license
 *    Copyright 2016 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
'use strict';
const expect                = require('chai').expect;
const parser                = require('../bin/path-parser');

describe('path-parser', () => {

    describe('#createRxFromStringPath', () => {

        it('foo', () => {
            const rx = parser.createRxFromStringPath('foo', 'colon');
            expect(rx.toString()).to.equal('/^foo$/');
        });

        it('foo/', () => {
            const rx = parser.createRxFromStringPath('foo/', 'colon');
            expect(rx.toString()).to.equal('/^foo$/');
        });

        it('/foo/', () => {
            const rx = parser.createRxFromStringPath('/foo/', 'colon');
            expect(rx.toString()).to.equal('/^foo$/');
        });

        it('/:foo', () => {
            const params = [];
            const rx = parser.createRxFromStringPath('/:foo', 'colon', params);
            expect(rx.toString()).to.equal('/^([^\\/]+)$/');
        });

        it('/:foo*', () => {
            const params = [];
            const rx = parser.createRxFromStringPath('/:foo*', 'colon', params);
            expect(rx.toString()).to.equal('/^([\\s\\S]+?)$/');
        });

        it('/:foo?', () => {
            const params = [];
            const rx = parser.createRxFromStringPath('/:foo?', 'colon', params);
            expect(rx.toString()).to.equal('/^(?:([^\\/]+))?$/');
        });

        it('/:foo*?', () => {
            const params = [];
            const rx = parser.createRxFromStringPath('/:foo*?', 'colon', params);
            expect(rx.toString()).to.equal('/^(?:([\\s\\S]+?))?$/');
        });

        it('/{foo}', () => {
            const params = [];
            const rx = parser.createRxFromStringPath('/{foo}', 'handlebar', params);
            expect(rx.toString()).to.equal('/^([^\\/]+)$/');
        });

        it('/{{foo}}', () => {
            const params = [];
            const rx = parser.createRxFromStringPath('/{{foo}}', 'doubleHandlebar', params);
            expect(rx.toString()).to.equal('/^([^\\/]+)$/');
        });

    });

    describe('#parser', () => {

        it('invalid input', () => {
            expect(() => { parser.parser() }).to.throw(Error);
        });

        describe('rx provided', () => {
            let fn;
            before(() => fn = parser.parser(/^foo\/([^\/]+)$/));

            it('foo', () => {
                expect(fn('foo')).to.deep.equal(null);
            });

            it('foo/bar', () => {
                const match = /^foo\/([^\/]+)$/.exec('foo/bar');
                expect(fn('foo/bar')).to.deep.equal(match);
            });
        });

        describe('foo', () => {
            let fn;
            before(() => fn = parser.parser('foo', 'colon'));

            it('foo', () => {
                expect(fn('foo')).to.deep.equal({});
            });

            it('bar', () => {
                expect(fn('bar')).to.deep.equal(null);
            });
        });

        describe(':foo', () => {
            let fn;
            before(() => fn = parser.parser(':foo', 'colon'));

            it('foo', () => {
                expect(fn('foo')).to.deep.equal({ foo: 'foo' });
            });

            it('bar', () => {
                expect(fn('bar')).to.deep.equal({ foo: 'bar' });
            });
        });

        describe('foo/:bar', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar', 'colon'));

            it('foo', () => {
                expect(fn('foo')).to.deep.equal(null);
            });

            it('foo/bar', () => {
                expect(fn('foo/bar')).to.deep.equal({ bar: 'bar' });
            });

            it('foo/bar/baz', () => {
                expect(fn('foo/bar/baz')).to.deep.equal(null);
            });
        });

        describe('foo/:bar/:baz', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar/:baz', 'colon'));

            it('foo', () => {
                expect(fn('foo')).to.equal(null);
            });

            it('foo/bar', () => {
                expect(fn('foo/bar')).to.deep.equal(null);
            });

            it('foo/bar/baz', () => {
                expect(fn('foo/bar/baz')).to.deep.equal({ bar: 'bar', baz: 'baz' });
            });
        });

        describe('foo/:bar/baz', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar/baz', 'colon'));

            it('foo/bar/baz', () => {
                expect(fn('foo/bar/baz')).to.deep.equal({ bar: 'bar' });
            });

            it('foo/bar', () => {
                expect(fn('foo/bar')).to.deep.equal(null);
            });
        });

        describe('foo/:bar*', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar*', 'colon'));

            it('foo/bar/baz', () => {
                expect(fn('foo/bar/baz')).to.deep.equal({ bar: 'bar/baz' });
            });

            it('foo/bar', () => {
                expect(fn('foo/bar')).to.deep.equal({ bar: 'bar' });
            });

            it('foo', () => {
                expect(fn('foo')).to.deep.equal(null);
            });
        });

        describe('foo/:bar?', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar?', 'colon'));

            it('foo/bar/baz', () => {
                expect(fn('foo/bar/baz')).to.deep.equal(null);
            });

            it('foo/bar', () => {
                expect(fn('foo/bar')).to.deep.equal({ bar: 'bar' });
            });

            it('foo', () => {
                expect(fn('foo')).to.deep.equal({});
            });
        });

        describe('foo/:bar?/:baz', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar?/:baz', 'colon'));

            it('foo/bar/baz', () => {
                expect(fn('foo/bar/baz')).to.deep.equal({ bar: 'bar', baz: 'baz' });
            });

            it('foo/bar', () => {
                expect(fn('foo/bar')).to.deep.equal({ baz: 'bar' });
            });

            it('foo', () => {
                expect(fn('foo')).to.deep.equal(null);
            });
        });

        describe('foo/:bar?/baz', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar?/baz', 'colon'));

            it('foo/bar/baz', () => {
                expect(fn('foo/bar/baz')).to.deep.equal({ bar: 'bar' });
            });

            it('foo/bar', () => {
                expect(fn('foo/bar')).to.deep.equal(null);
            });

            it('foo/baz', () => {
                expect(fn('foo/baz')).to.deep.equal({});
            });
        });

        describe('foo/:bar?/baz/:abc', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar?/baz/:abc', 'colon'));

            it('foo/bar/baz/abc', () => {
                expect(fn('foo/bar/baz/abc')).to.deep.equal({ abc: 'abc', bar: 'bar' });
            });

            it('foo/bar', () => {
                expect(fn('foo/bar')).to.deep.equal(null);
            });

            it('foo/baz/abc', () => {
                expect(fn('foo/baz/abc')).to.deep.equal({ abc: 'abc' });
            });
        });

        describe('foo/:bar*/baz', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar*/baz', 'colon'));

            it('foo/bar/baz', () => {
                expect(fn('foo/bar/baz')).to.deep.equal({ bar: 'bar' });
            });

            it('foo/bar', () => {
                expect(fn('foo/bar')).to.deep.equal(null);
            });

            it('foo/bar/be/que/baz', () => {
                expect(fn('foo/bar/be/que/baz')).to.deep.equal({ bar: 'bar/be/que'});
            });
        });

        describe('foo/:bar*/:baz*', () => {
            let fn;
            before(() => fn = parser.parser('foo/:bar*/:baz*', 'colon'));

            it('foo/bar/baz', () => {
                expect(fn('foo/bar/baz')).to.deep.equal({ bar: 'bar', baz: 'baz' });
            });

            it('foo/bar/baz/abc', () => {
                expect(fn('foo/bar/baz/abc')).to.deep.equal({ bar: 'bar', baz: 'baz/abc' });
            });

            it('foo/bar/be/que/baz', () => {
                expect(fn('foo/bar/be/que/baz')).to.deep.equal({ bar: 'bar', baz: 'be/que/baz'});
            });

            it('foo', () => {
                expect(fn('foo')).to.deep.equal(null);
            });
        });

    });

});