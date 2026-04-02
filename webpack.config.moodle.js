/**
 * Webpack configuration for the Moodle editor_gutenberg plugin.
 *
 * Builds the Isolated Block Editor into a UMD bundle that Moodle's
 * AMD/RequireJS loader can consume. React and ReactDOM are bundled
 * in (not external) since Moodle does not provide them.
 *
 * Output: lib/editor/gutenberg/amd/build/gutenberg-editor.min.js
 *         lib/editor/gutenberg/amd/build/gutenberg-editor.css
 */
const path = require( 'path' );
const webpack = require( 'webpack' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const TerserJSPlugin = require( 'terser-webpack-plugin' );

const config = {
	entry: {
		'gutenberg-editor': './src/moodle/index.js',
	},
	output: {
		// .min.js suffix is required for Moodle's AMD auto-discovery.
		filename: '[name].min.js',
		path: path.resolve( __dirname, 'lib/editor/gutenberg/amd/build' ),
		library: {
			name: 'GutenbergEditor',
			type: 'umd',
		},
		// Use 'this' so UMD works in both browser and AMD contexts.
		globalObject: 'this',
	},
	module: {
		rules: [
			{
				// Mark block registration files as side-effectful so webpack
				// doesn't tree-shake the registerBlockType() calls.
				test: /src\/moodle\/blocks\/.+\/index\.js$/,
				sideEffects: true,
			},
			{
				test: /\.(js|mjs)$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
			},
			{
				test: /\.scss|\.css$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
					},
					'css-loader',
					'sass-loader',
				],
			},
		],
	},
	// React and ReactDOM are NOT externals — Moodle does not provide them,
	// so they must be bundled into the editor JS.
	plugins: [
		new webpack.DefinePlugin( {
			'process.env': { NODE_ENV: JSON.stringify( process.env.NODE_ENV || 'development' ) },
		} ),
		new MiniCssExtractPlugin( {
			filename: '[name].css',
		} ),
	],
	optimization: {
		minimizer: [ new TerserJSPlugin() ],
	},
};

if ( process.env.NODE_ENV === 'development' ) {
	config.devtool = 'source-map';
}

module.exports = config;
