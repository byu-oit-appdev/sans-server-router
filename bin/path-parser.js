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

/**
 * Get a function that can be called to provide parameter matches for url paths.
 * @param {string|RegExp} path The matching path descriptor.
 * @param {string} [format]
 * @param {boolean} [caseSensitive=false]
 * @returns {Function}
 */
exports.parser = function (path, format, caseSensitive) {
    const params = [];
    const rx = typeof path === 'string'
        ? exports.createRxFromStringPath(path, format, caseSensitive, params)
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
        const subPath = urlPath.replace(/^\//, '').replace(/\/$/, '');
        const match = rx.exec(subPath);
        if (!match) return null;

        if (path === rx) {
            return match;
        } else {
            const parameters = {};
            for (let i = 1; i < match.length; i++) {
                if (match[i] !== undefined) parameters[params[i - 1]] = match[i];
            }
            return parameters;
        }
    }
};

/**
 * Create a regular expression from a string path definition.
 * @param {string} path
 * @param {string} [format='colon']
 * @param {boolean} [caseSensitive=false]
 * @param {Array} [params]
 * @returns {RegExp}
 */
exports.createRxFromStringPath = function (path, format, caseSensitive, params) {
    if (!format) format = 'colon';
    path = path.replace(/^\//, '').replace(/\/$/, '');

    // determine matching rx
    const rx = format === 'doubleHandlebar'
        ? /(?:{{([_$a-z][_$a-z0-9]*)(\*|\?)?}})|(\*)/ig
        : format === 'handlebar'
        ? /(?:{([_$a-z][_$a-z0-9]*)(\*|\?)?})|(\*)/ig
        : /(?::([_$a-z][_$a-z0-9]*)(\*|\?)?)|(\*)/ig;

    const p = exports.rx.param;
    const w = exports.rx.wildcard;

    let match;
    let offset = 0;
    let result = '^';
    while (match = rx.exec(path)) {
        result += escapeRxString(path.substring(offset, match.index));

        if (match[3] === '*') {
            offset = match.index + 1;
            result += '' + w + '*?';
        } else {
            const modifier = match[2] || '';
            if (params) params.push(match[1]);
            if (modifier === '*') result += '(' + w + '*?)';
            if (modifier === '?') {
                if (result.charAt(result.length - 1) === '/') {
                    result = result.substr(0, result.length -1) + '(?:\/(' + p + '+?))?';
                } else {
                    result += '(?:(' + p + '+?))?';
                }
            }
            if (!modifier) result += '(' + p + '+?)';
            offset = match.index + match[0].length;
        }
    }
    result += escapeRxString(path.substr(offset)) + '$';

    return new RegExp(result, caseSensitive ? '' : 'i');
};

exports.rx = {
    param: '(?:[a-zA-Z0-9\\.\\-_~!$&\'()*+,;=:@]|%[a-fA-F0-9]{2})',
    wildcard: '(?:[a-zA-Z0-9\\.\\-_~!$&\'()*+,;=:@\\/]|%[a-fA-F0-9]{2})'
};

function escapeRxString(str) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}