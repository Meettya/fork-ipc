module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["tsconfig.eslint.json"],
  },
  plugins: ["@typescript-eslint", "jest", "sort-destructure-keys"],
  extends: [
    "eslint-config-standard-with-typescript",
    "plugin:jest/recommended",
    "prettier",
  ],
  rules: {
    "sort-keys": "error",
    "sort-destructure-keys/sort-destructure-keys": 2,
    "padding-line-between-statements": [
      "error",
      { blankLine: "always", prev: ["const", "let", "var"], next: "return" },
    ],
    "padded-blocks": ["error", { blocks: "never" }],
    "no-trailing-spaces": "error",
    "eol-last": ["error", "always"],
    "comma-style": ["error", "last"],
    "comma-dangle": [
      "error",
      {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "only-multiline",
        exports: "always-multiline",
        functions: "always-multiline",
      },
    ],
    "no-multiple-empty-lines": "error",
    "@typescript-eslint/semi": ["error", "never"],
  },
}
