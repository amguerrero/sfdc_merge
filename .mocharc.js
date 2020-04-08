'use strict';

// Here's a JavaScript-based config file.
// If you need conditional logic, you might want to use this type of config.
// Otherwise, JSON or YAML is recommended.

module.exports = {
    require: 'ts-node/register',
    'watch-extensions': 'ts',
    recursive: true,
    reporter: 'spec',
    timeout: 10000,
    slow: 0,
};