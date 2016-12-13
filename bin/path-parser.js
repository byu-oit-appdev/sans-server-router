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
const rxColon = /^:([_$a-z][_$a-z0-9]*)(\*|\?|\*\?)?$/;
const rxHandlebar = /^{([_$a-z][_$a-z0-9]*)(\*|\?|\*\?)?}$/;
const rxDoubleHandlebar = /^{{([_$a-z][_$a-z0-9]*)(\*|\?|\*\?)?}}$/;

/**
 * Get a function that can be called to provide parameter matches for url paths.
 * @param {string} path The matching path descriptor.
 * @param {string} [format]
 * @returns {Function}
 */
exports.parser = function (path, format) {
    const params = [];
    const rx = typeof path === 'string'
        ? exports.createRxFromStringPath(path, format, params)
        : path;

    // validate that rx could be acquired
    if (!(rx instanceof RegExp)) {
        const err = Error('Path definition must be a string or a regular expression.');
        err.code = 'ESSRPTH';
        throw err;
    }

    /**
     * Take a URL path and determine the path parameters.
     * @param {string} urlPath
     * @returns {Object}
     */
    return function(urlPath) {
        const match = rx.exec(urlPath);
        if (!match) return null;

        const parameters = {};
        for (let i = 1; i < match.length; i++) {
            if (match[i] !== undefined) parameters[params[i - 1][1]] = match[i];
        }

        return parameters;
    }
};

/**
 * Create a regular expression from a string path definition.
 * @param {string} path
 * @param {string} [format='colon']
 * @param {Array} [params]
 * @returns {RegExp}
 */
exports.createRxFromStringPath = function (path, format, params) {
    if (!format) format = 'colon';
    path = path.replace(/^\//, '').replace(/\/$/, '');
    const str = path.split('/')
        .map(function(item, index) {
            const prefix = (index ? '\\/' : '');
            const rx = format === 'colon'
                ? rxColon
                : format === 'handlebar'
                ? rxHandlebar
                : rxDoubleHandlebar;

            const match = rx.exec(item);
            if (match || item === '*') {
                const modifier = match ? match[2] : '*';
                if (params) params.push(match);
                if (!modifier || modifier === '*') {
                    return prefix + (modifier ? '([\\s\\S]+?)' : '([^\\/]+)');
                } else {
                    return '(?:' + prefix + (modifier === '?' ? '([^\\/]+)' : '([\\s\\S]+?)') + ')?';
                }
            } else {
                return prefix + item;
            }
        })
        .join('');
    return new RegExp('^' + str + '$');
};