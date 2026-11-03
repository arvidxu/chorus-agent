---
name: chorus-i18n
description: Use when adding or changing user-visible text (including native menus and dialogs, TUI and CLI output, and text the host returns to the UI), translation resources, or locale files.
---

## Internationalization

Read and follow this section before adding or changing any user-visible text (including main-process native menus and dialogs, TUI and CLI output, and text returned by the host to the UI), translation resources, or locale files.

- Read all user-visible text through the project's internationalization interface, including page text, buttons, labels, hints, placeholders, dialog titles, table headers, notifications, and accessible names.
- Main-process native menus and dialogs, TUI interfaces, and CLI help and error output use the same translation resources through the React-independent interface in `packages/ui/i18n`; export React bindings separately.
- Commander built-in help headings and parsing errors use these resources too, with text mapped by error code rather than parsing English errors or relying on private Commander APIs.
- Write English source text and translations only in the corresponding dictionaries under `packages/ui/i18n/src/locales/`, not directly in pages, components, or notification calls, and do not use hardcoded English fallbacks.
- Use existing common keys and put feature-specific text in its namespace; use placeholders for dynamic values, not concatenated translation fragments.
- The shared internationalization layer handles plurals and grammar through the library's plural rules, not language branches or `count === 1` checks in feature code.
- The keys below illustrate syntax only; check actual directories and existing keys before adding any.

```json
{
  "session.created": "Session {{name}} created"
}
```

```tsx
// Correct: the call site supplies only the key and dynamic parameters.
toast.success(t('session.created', { name: session.name }))

// Incorrect: hardcoded English or combining translation fragments into a sentence.
toast.success('Session ' + session.name + ' created')
toast.success(t('session.prefix') + session.name + t('session.suffix'))
```

- Add new translation keys for all enabled languages together; when changing English source text, update affected translations too.
- Actually translate each language: do not copy identical text into every language file or substitute English or placeholders for translations.
- Preserve placeholders and escape sequences exactly, and do not translate brand names or technical identifiers.
- Reuse existing keys only when semantic ownership and text role are identical.
- Review and resolve missing keys, extra keys, and stale translations.
- For translation files maintained by a generation process or designated person, use that process rather than bypassing the maintenance entry point.
- Update all language versions of multilingual user documentation together.

- The `en` dictionary determines the key set and order: group keys by feature and namespace, and within groups follow their appearance in the UI. Insert keys next to related keys; do not alphabetize existing keys. Every other enabled language must have exactly the same key set and order as `en`, checked in review. Format locale files normally with Oxfmt, which does not reorder ordinary JSON keys. Translation-key extraction tools must follow this ordering convention without alphabetizing.

- Do not translate solely from model knowledge: check terminology and grammar against Unicode CLDR, platform localization style guides, and established projects' localization work.
- Use terms common in the target-language developer community, retain common English loanwords and abbreviations, and maintain a glossary of terms not to translate.
- Tasks only filling missing translations fill empty values only, without rewriting existing translations or keys incidentally.
- Source-text changes, confirmed mistranslations, and user-requested revisions update affected content through the project's translation process.
- Do not change English source text or key names to make translation easier unless the task explicitly requests text changes.

- Map user-facing errors to translation keys through error codes or types instead of displaying exception messages directly. Logs, exceptions, and developer diagnostics use English and do not belong in translation dictionaries. Choose user-facing names by meaning from the product glossary, not global search-and-replace renaming. Derive displayed names through key or tool-name mappings, not by directly converting internal identifiers into readable text.
- The host returns translation keys or error codes with parameters; clients display them in their own language.
- The host does not return translated sentences, and clients do not perform string replacements.
- For text the host must generate without request context (such as scheduled-task system notifications), use the recipient's language: content pushed to a phone uses its registered language; other content uses the user's language configured on the host.
- CLI output before host startup uses the system language.
- Display dates, times, numbers, and durations through the unified formatters in `packages/ui/i18n`, respecting user timezone and locale, rather than calling `toLocaleString()` directly in components. Parse externally supplied dates strictly.

- English UI text uses sentence case, capitalizing only the first word and proper nouns, with abbreviations remaining uppercase.
- UI text and documentation avoid signs of AI-generated text: stacked dashes, "not only ... but also ..." constructions, forced groups of three parallel items, and vague openings.
- Changing UI text (including translation keys and translations) is a product behavior change: [Testing and verification](../chorus-testing/SKILL.md#testing-and-verification) does not require tests first, but verification in the rendered result is required; tests that only assert a key exists do not prove the page rendered text correctly.

- Before changing text displayed to users, search the repository root for a distinctive fragment and check which code, queries, and tests depend on it.
- When code or queries identify released persisted messages by part of their text, preserve that fragment and identification logic and change only the remainder, so saved older messages remain recognizable.
- New code identifies messages through structured fields, not text.
- Update tests checking that text and page-test wrappers relying on it to locate elements or check displayed content in the same PR.
- New tests or component demonstration stories must not keep hardcoding old text.
- Do not use identifiers such as variable names, development-task descriptions, or PR descriptions directly as user-facing text.
- After moving text into a helper, rewriting it in a new conditional branch, copying it from an adjacent message, or resolving a merge conflict, recheck wording and these dependencies. This rule applies only to product UI text, not documentation, code comments, test names, commit messages, or PR descriptions.
