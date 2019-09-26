const path = require('path');

module.exports = {
    entry: './lib/webpack.build.js',
    output: {
        filename: 'kofosdk.js',
        path: path.resolve(__dirname, 'dist')
    }
};