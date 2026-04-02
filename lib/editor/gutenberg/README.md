# Gutenberg Editor for Moodle

A Moodle text editor plugin that integrates [Automattic's Isolated Block Editor](https://github.com/Automattic/isolated-block-editor) (Gutenberg) as an alternative to Atto and TinyMCE.

## Features

- Full Gutenberg block editor experience inside Moodle text areas
- Core WordPress blocks: paragraph, heading, list, image, quote, table, columns, code, separator
- Custom Moodle blocks:
  - **Callout Box** - info/warning/success/danger styled callouts with Bootstrap-compatible colours
  - **Activity Link** - link card to any activity in the current course, with auto-complete picker
- Content persistence through Moodle's HTMLPurifier (dual-representation with data attributes)
- Text filter for display-time block rendering cleanup
- AJAX web service for fetching course activities

## Requirements

- Moodle 4.4 or later (requires version 2024042200)
- PHP 8.1+
- Node.js 18+ and Yarn (for building from source)

## Installation

1. Clone or download this repository.
2. Copy the `lib/editor/gutenberg` directory into your Moodle installation at `lib/editor/gutenberg`.
3. Visit **Site administration > Notifications** to trigger the plugin installation.
4. Go to **Site administration > Plugins > Text editors > Manage editors** and enable the Gutenberg editor.

### Building from source

The webpack-bundled JavaScript must be built before the plugin will work:

```bash
yarn install
yarn build:moodle
```

This produces `lib/editor/gutenberg/amd/build/gutenberg-editor.min.js` and the associated CSS bundle.

## Architecture

The plugin bridges Moodle's AMD/RequireJS module system with a webpack-bundled React application:

- **AMD bridge** (`amd/src/editor.js`): Loaded by Moodle's page requirements system, delegates to the webpack bundle
- **Webpack UMD bundle** (`amd/build/gutenberg-editor.min.js`): Contains the Isolated Block Editor, React, ReactDOM, and all block registrations
- **Content processor**: Handles bidirectional conversion between Gutenberg's comment-delimited format and Moodle-safe HTML with `data-gutenberg-block` attributes
- **Text filter**: Cleans up block markup at display time via Moodle's text filter pipeline

## Custom Blocks

### Callout Box (`moodle/callout-box`)

A styled callout with four variants: info, warning, success, danger. Supports rich text title and body.

### Activity Link (`moodle/activity-link`)

Links to a Moodle course activity. Uses an AJAX web service (`editor_gutenberg_get_course_activities`) to populate a searchable picker in the editor.

## Content Handling

Gutenberg stores content with HTML comment delimiters (`<!-- wp:paragraph -->...<!-- /wp:paragraph -->`). Since Moodle's `format_text()` strips HTML comments via HTMLPurifier, the plugin uses a dual-representation strategy:

1. Block comments are preserved in the database for re-editing
2. `data-gutenberg-block` attributes are added to the first HTML element of each block as a fallback
3. If comments are stripped (e.g. by a copy/paste path), the editor reconstructs them from data attributes

## Privacy

This plugin does not store any personal user data. It implements the Moodle Privacy API as a null provider.

## Maturity

**Alpha** - This plugin is in early development. It is not yet suitable for production use.

## License

GNU GPL v3 or later. See [LICENSE](http://www.gnu.org/copyleft/gpl.html) for details.

## Credits

- Built on [Automattic's Isolated Block Editor](https://github.com/Automattic/isolated-block-editor)
- Copyright 2026 Aldrin Magno
