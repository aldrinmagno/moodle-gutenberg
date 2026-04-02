<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Content processor for Gutenberg block markup.
 *
 * Handles bidirectional conversion between Gutenberg's comment-delimited
 * block format and Moodle-safe HTML with data attributes.
 *
 * == The problem ==
 *
 * Gutenberg stores block boundaries as HTML comments:
 *   <!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->
 *
 * Moodle's HTMLPurifier strips comments at display time (format_text).
 * This is fine for display — the inner HTML is complete. But if comments
 * are ever stripped at storage time (PARAM_CLEANHTML), re-editing fails
 * because Gutenberg can't reconstruct block boundaries.
 *
 * == The solution ==
 *
 * 1. On save (Gutenberg → Moodle): keep comments AND add data attributes
 *    to the outermost element of each block as a redundant marker.
 * 2. On load (Moodle → Gutenberg): if comments are present, use them
 *    directly (Gutenberg parser handles this). If comments were stripped,
 *    reconstruct them from data attributes.
 * 3. On display: format_text() strips comments naturally. The HTML with
 *    data attributes renders correctly with our CSS.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace editor_gutenberg;

defined('MOODLE_INTERNAL') || die();

/**
 * Processes content between Gutenberg block format and Moodle storage.
 *
 * @package    editor_gutenberg
 * @copyright  2026 Aldrin Magno
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class content_processor {

    /**
     * Regex matching a Gutenberg block comment pair with its content.
     *
     * Captures:
     *   1 = block name (e.g. "paragraph" or "moodle/callout-box")
     *   2 = JSON attributes (optional, may be empty)
     *   3 = inner HTML content
     */
    private const BLOCK_PATTERN =
        '/<!--\s+wp:([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?)\s*(\{[^}]*\})?\s*-->'
        . '(.*?)'
        . '<!--\s+\/wp:\1\s*-->/s';

    /**
     * Regex matching a self-closing Gutenberg block comment (no inner HTML).
     *
     * Captures:
     *   1 = block name
     *   2 = JSON attributes
     */
    private const SELF_CLOSING_BLOCK_PATTERN =
        '/<!--\s+wp:([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?)\s*(\{[^}]*\})?\s*\/-->/s';

    /**
     * Process content for storage in Moodle.
     *
     * Adds data-gutenberg-block and data-gutenberg-attrs attributes
     * to the first HTML element inside each block, providing a redundant
     * marker that survives HTMLPurifier.
     *
     * @param string $content Raw Gutenberg editor output.
     * @return string Content with data attributes added.
     */
    public static function prepare_for_storage(string $content): string {
        if (empty($content) || !self::has_block_comments($content)) {
            return $content;
        }

        // Process regular blocks (with inner content).
        $content = preg_replace_callback(self::BLOCK_PATTERN, function ($matches) {
            $blockname = $matches[1];
            $attrs = trim($matches[2] ?? '');
            $inner = $matches[3];

            // Add data attributes to the first HTML tag inside the block.
            $inner = self::inject_data_attributes($inner, $blockname, $attrs);

            // Preserve the original comment delimiters.
            $opening = "<!-- wp:{$blockname}" . ($attrs ? " {$attrs}" : '') . " -->";
            $closing = "<!-- /wp:{$blockname} -->";

            return $opening . $inner . $closing;
        }, $content);

        return $content;
    }

    /**
     * Prepare content for loading into the Gutenberg editor.
     *
     * If block comments are present, returns content as-is (Gutenberg's
     * parser handles it). If comments were stripped (e.g. by PARAM_CLEANHTML),
     * attempts to reconstruct them from data attributes.
     *
     * @param string $content Content from database.
     * @return string Content ready for Gutenberg parser.
     */
    public static function prepare_for_editor(string $content): string {
        if (empty($content)) {
            return $content;
        }

        // If block comments are still present, no reconstruction needed.
        if (self::has_block_comments($content)) {
            return $content;
        }

        // No block comments — try to reconstruct from data attributes.
        if (strpos($content, 'data-gutenberg-block') === false) {
            // No data attributes either — this is plain HTML, not Gutenberg content.
            return $content;
        }

        return self::reconstruct_block_comments($content);
    }

    /**
     * Prepare content for display (called during rendering).
     *
     * Strips any remaining block comments and ensures clean HTML.
     * Moodle's format_text() normally handles this via HTMLPurifier,
     * but this method provides an explicit cleanup path.
     *
     * @param string $content Content to prepare for display.
     * @return string Clean HTML without block comments.
     */
    public static function prepare_for_display(string $content): string {
        if (empty($content)) {
            return $content;
        }

        // Strip block comments (opening, closing, and self-closing).
        $content = preg_replace(
            '/<!--\s+\/?wp:[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?\s*(?:\{[^}]*\})?\s*\/?-->\n?/',
            '',
            $content
        );

        return trim($content);
    }

    /**
     * Check whether content contains Gutenberg block comments.
     *
     * @param string $content Content to check.
     * @return bool True if block comments are present.
     */
    public static function has_block_comments(string $content): bool {
        return (bool) preg_match('/<!--\s+wp:/', $content);
    }

    /**
     * Inject data attributes into the first HTML tag of block content.
     *
     * Given inner HTML like `<p class="foo">text</p>`, adds:
     *   data-gutenberg-block="paragraph"
     *   data-gutenberg-attrs='{"align":"center"}'
     *
     * @param string $html Inner HTML of a block.
     * @param string $blockname The block name (e.g. "paragraph").
     * @param string $attrs JSON attributes string (may be empty).
     * @return string HTML with data attributes on the first element.
     */
    private static function inject_data_attributes(string $html, string $blockname, string $attrs): string {
        $html = ltrim($html);

        // Find the first HTML tag.
        if (!preg_match('/^(<[a-z][a-z0-9]*)([\s>])/i', $html, $match, PREG_OFFSET_MATCH)) {
            // No HTML tag found (could be raw text). Wrap in a span.
            $attrstr = $attrs ? " data-gutenberg-attrs='" . self::escape_attr($attrs) . "'" : '';
            return '<span data-gutenberg-block="' . self::escape_attr($blockname) . '"'
                . $attrstr . '>' . $html . '</span>';
        }

        // Don't add duplicate attributes.
        if (strpos($html, 'data-gutenberg-block') !== false) {
            return $html;
        }

        // Insert data attributes after the tag name.
        $insertpos = $match[1][1] + strlen($match[1][0]);
        $dataattrs = ' data-gutenberg-block="' . self::escape_attr($blockname) . '"';
        if ($attrs) {
            $dataattrs .= " data-gutenberg-attrs='" . self::escape_attr($attrs) . "'";
        }

        return substr($html, 0, $insertpos) . $dataattrs . substr($html, $insertpos);
    }

    /**
     * Reconstruct block comments from data attributes.
     *
     * Scans HTML for elements with data-gutenberg-block attributes
     * and wraps them in the corresponding block comment delimiters.
     *
     * @param string $html HTML with data attributes but no block comments.
     * @return string HTML with block comments restored.
     */
    private static function reconstruct_block_comments(string $html): string {
        // Match elements that have data-gutenberg-block attribute.
        // This regex finds the opening tag, captures the block name and attrs,
        // then finds the matching closing tag.
        return preg_replace_callback(
            '/<([a-z][a-z0-9]*)\s+[^>]*?data-gutenberg-block="([^"]*)"'
            . '(?:\s+[^>]*?data-gutenberg-attrs=\'([^\']*)\')?[^>]*>'
            . '(.*?)'
            . '<\/\1>/si',
            function ($matches) {
                $blockname = $matches[2];
                $attrs = !empty($matches[3]) ? ' ' . html_entity_decode($matches[3]) : '';
                $fullmatch = $matches[0];

                $opening = "<!-- wp:{$blockname}{$attrs} -->";
                $closing = "<!-- /wp:{$blockname} -->";

                return $opening . "\n" . $fullmatch . "\n" . $closing;
            },
            $html
        );
    }

    /**
     * Escape a string for use in an HTML attribute.
     *
     * @param string $value The value to escape.
     * @return string Escaped value safe for HTML attributes.
     */
    private static function escape_attr(string $value): string {
        return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
