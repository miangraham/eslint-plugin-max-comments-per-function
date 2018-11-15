/**
 * @fileoverview A rule to set the maximum number of comments in a function body. Based on core rule max-lines-per-function.
 * @author Pete Ward <peteward44@gmail.com>
 * @author M. Ian Graham <hello@miangraham.com>
 */
'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const astUtils = require('eslint/lib/util/ast-utils');

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

const OPTIONS_SCHEMA = {
    type: 'object',
    properties: {
        max: {
            type: 'integer',
            minimum: 0
        }
    },
    additionalProperties: false
};

const OPTIONS_OR_INTEGER_SCHEMA = {
    oneOf: [
        OPTIONS_SCHEMA,
        {
            type: 'integer',
            minimum: 1
        }
    ]
};

/**
 * Given a list of comment nodes, return a map with numeric keys (source code line numbers) and comment token values.
 * @param {Array} comments An array of comment nodes.
 * @returns {Map.<string,Node>} A map with numeric keys (source code line numbers) and comment token values.
 */
function getCommentLineNumbers(comments) {
    const map = new Map();

    if (!comments) {
        return map;
    }
    comments.forEach(comment => {
        for (let i = comment.loc.start.line; i <= comment.loc.end.line; i++) {
            map.set(i, comment);
        }
    });
    return map;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports.rules = {
    'max-comments-per-function': {
        meta: {
            type: 'suggestion',

            docs: {
                description: 'enforce a maximum number of comments in a function',
                category: 'Stylistic Issues',
                recommended: false,
                url: 'https://github.com/miangraham/eslint-plugin-max-comments-per-function'
            },

            schema: [OPTIONS_OR_INTEGER_SCHEMA]
        },

        create(context) {
            const sourceCode = context.getSourceCode();
            const lines = sourceCode.lines;

            const option = context.options[0];
            let maxComments = 50;

            if (typeof option === 'object') {
                if (typeof option.max === 'number') {
                    maxComments = option.max;
                }
            } else if (typeof option === 'number') {
                maxComments = option;
            }

            const commentLineNumbers = getCommentLineNumbers(sourceCode.getAllComments());

            //--------------------------------------------------------------------------
            // Helpers
            //--------------------------------------------------------------------------

            /**
             * Tells if a comment encompasses the entire line.
             * @param {string} line The source line with a trailing comment
             * @param {number} lineNumber The one-indexed line number this is on
             * @param {ASTNode} comment The comment to remove
             * @returns {boolean} If the comment covers the entire line
             */
            function isFullLineComment(line, lineNumber, comment) {
                const start = comment.loc.start;

                const end = comment.loc.end;

                const isFirstTokenOnLine =
                    start.line === lineNumber && !line.slice(0, start.column).trim();

                const isLastTokenOnLine = end.line === lineNumber && !line.slice(end.column).trim();

                return (
                    comment &&
                    (start.line < lineNumber || isFirstTokenOnLine) &&
                    (end.line > lineNumber || isLastTokenOnLine)
                );
            }

            /**
             * Identifies is a node is a FunctionExpression which is embedded within a MethodDefinition or Property
             * @param {ASTNode} node Node to test
             * @returns {boolean} True if it's a FunctionExpression embedded within a MethodDefinition or Property
             */
            function isEmbedded(node) {
                if (!node.parent) {
                    return false;
                }
                if (node !== node.parent.value) {
                    return false;
                }
                if (node.parent.type === 'MethodDefinition') {
                    return true;
                }
                if (node.parent.type === 'Property') {
                    return (
                        node.parent.method === true ||
                        node.parent.kind === 'get' ||
                        node.parent.kind === 'set'
                    );
                }
                return false;
            }

            /**
             * Count the comments in the function
             * @param {ASTNode} funcNode Function AST node
             * @returns {void}
             * @private
             */
            function processFunction(funcNode) {
                const node = isEmbedded(funcNode) ? funcNode.parent : funcNode;

                let commentCount = 0;

                for (let i = node.loc.start.line - 1; i < node.loc.end.line; ++i) {
                    const line = lines[i];

                    if (
                        commentLineNumbers.has(i + 1) &&
                        isFullLineComment(line, i + 1, commentLineNumbers.get(i + 1))
                    ) {
                        commentCount++;
                    }
                }

                if (commentCount > maxComments) {
                    const name = astUtils.getFunctionNameWithKind(funcNode);

                    context.report({
                        node,
                        message:
                            '{{name}} has too many comments ({{commentCount}}). Maximum allowed is {{maxComments}}.',
                        data: {name, commentCount, maxComments}
                    });
                }
            }

            //--------------------------------------------------------------------------
            // Public API
            //--------------------------------------------------------------------------

            return {
                FunctionDeclaration: processFunction,
                FunctionExpression: processFunction,
                ArrowFunctionExpression: processFunction
            };
        }
    }
};
