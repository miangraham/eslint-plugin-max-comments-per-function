# eslint-plugin-max-comments-per-function

Rule to limit the number of comments in a function body.

Experimental. A dumb heuristic to reduce line noise. Comments as percentage of line count might be a smarter choice.

Based on [max-lines-per-function](http://eslint.org/docs/rules/max-lines-per-function) from the ESLint core rules, originally by [Pete Ward](https://github.com/peteward44). [LICENSE](./LICENSE) (MIT) preserved.

## Installation

```bash
$ npm install --save-dev eslint-plugin-max-comments-per-function
# or
$ yarn add -D eslint-plugin-max-comments-per-function
```

## Configuration
.eslintrc additions:
```yaml
---
plugins:
  - max-comments-per-function
rules:
  - max-comments-per-function/max-comments-per-function:
    - error
    - 3
```

## Disallowed
```js
function foo() {
  // I
  const a = 1;

  // love
  let b = 2;

  // comments
  b++;

  // so much
  return b;
}
```

## Allowed
```js
function foo() {
  // I love
  const a = 1;

  // comments
  let b = 2;

  // a bit
  b++;
  return b;
}
```