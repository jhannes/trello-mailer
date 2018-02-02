module.exports = {
    entry: "./src/app.jsx",
    output: {
        path: __dirname + '/dist',
        filename: "index.bundle.js"
    },
    devtool: "source-maps",
    module: {
        loaders: [
            {
                test: [/.jsx$/],
                loader: 'babel-loader',
                query: {
                    presets: ['react', 'es2015']
                }
            }
        ]
    }
}
