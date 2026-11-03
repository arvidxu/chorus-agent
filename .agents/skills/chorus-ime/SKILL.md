---
name: chorus-ime
description: Use when handling text input, keyboard shortcuts, or composition events on desktop or mobile.
---

## Input methods and text input

The following browser event rules apply to Electron renderer DOM input controls; see this subsection's final rule for mobile native text fields. Chinese, Japanese, and Korean users compose input through input methods (IME): they enter pinyin or kana, see underlined composing text, then confirm characters from a candidate window. These rules prevent application actions or text rewrites from being triggered accidentally during composition.

- Keyboard shortcuts and submission first exclude IME composition: keystrokes with `event.isComposing` true or `keyCode === 229` belong to the IME and must not trigger application actions such as sending, submitting, selecting, or closing.
- Checking only `isComposing` is insufficient: Safari dispatches the Enter confirming a candidate after `compositionend`, when `isComposing` is already false and only `keyCode` remains 229.
- `packages/ui/components` publicly exports a shared key-checking function; components do not compare `e.key` directly.
- Handlers such as focus traps that must continue intercepting Tab during composition are an exception and explicitly use a check that does not inspect composition state.
- Android software keyboards report composing text with `keyCode` 229 and key names `Unidentified` or `Process`; use `input`, not `keydown`, to identify entered characters.
- Register shortcuts centrally in `packages/ui/features` so users can customize them, rather than hardcoding key checks in components.

- Do not rewrite text fields during composition: controlled inputs display the user's original value in the same render, without writing back formatted, validated, or one-frame-delayed values during composition.
- Do not change `key` during composition or remount inputs or editing regions through conditional rendering.
- Writing back or remounting interrupts composition, submitting entered pinyin or kana as literal letters and causing spaces or separators between letters, mixed letters and Chinese characters, or the cursor jumping to the end.
- Replace field contents only when the meaning of an externally sourced value actually differs from the current text.

- Do not process input immediately before composition ends: search suggestions, `@` mentions, `/` command parsing, completion, character counting and truncation, whitespace removal, autoformatting, and input validation all wait until after `compositionend` and operate on final text.
- When an `input` event has `isComposing` true, update display state only.
- Composing text may contain syllable separators inserted by the IME; processing it produces incorrect results or submits intermediate text.
- Rich-text and `contenteditable` editors must not rely solely on `preventDefault()` in `beforeinput` to intercept IME input: those events may not be cancelable, so also handle `input`.

- For fields that transform or send input values back, use typing tests wrapped in composition events to check that the entered text and cursor position remain unchanged.
- Test environments cannot run real input methods, so changes involving keyboard handling or text fields also require manual verification with a real IME: cover at least entering Chinese pinyin and pressing Enter to commit pinyin letters directly, selecting characters with Space or number keys, switching candidates with arrow or paging keys, and canceling composition with Escape, checked in Electron.
- When the agent cannot operate a real IME, mark these manual scenarios as unverified in the result and list the steps requiring human checking.
- After adding a Web client, also check in WebKit (Safari).

- React Native text fields on mobile likewise must not rewrite the controlled `value` while typing (perform formatting, truncation, whitespace removal, and similar processing on submission or blur), or remount midway through input.
- Changes involving mobile text fields require manual testing with a Chinese IME on both iOS and Android for committing pinyin, selecting characters, and canceling composition.
- When the agent cannot operate a real IME, mark these manual scenarios as unverified in the result and list the steps and runtime environments requiring human checking.
