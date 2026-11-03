---
name: chorus-ui
description: "Use when changing packages/ui, desktop renderer UI, or mobile UI: components, styling tokens, layout, accessibility, React state, or loading and error states."
---

## UI development

Text input handling rules are in [chorus-ime](../chorus-ime/SKILL.md).

- The component reuse, state, and feedback requirements apply to all client interfaces (desktop renderer, mobile, and TUI); accessibility requirements apply to desktop renderer and mobile (TUI focus, text labels, and keyboard operation rules belong to the `AGENTS.md` of `packages/ui/tui`, added with that package).
- These requirements apply wherever these interfaces are implemented, not only under `packages/ui/`.
- DOM, CSS, ARIA, and browser event rules apply to the Electron renderer and other DOM-based clients.
- React Hooks rules apply to React components; React Compiler is enabled for the scope listed under "Technology stack" in [Project structure and architecture](../chorus-architecture/SKILL.md#project-structure-and-architecture).
- See the `AGENTS.md` of `packages/ui/tui`, added with that package, for Solid TUI reactivity, input, and rendering, and [Mobile app (apps/mobile)](../chorus-mobile/SKILL.md#mobile-app-appsmobile) for mobile native capabilities.

- First inspect existing components, variants, parameters, and shared functions, and use the existing controls and icon library.
- When an existing component satisfies the requirement, do not recreate the same kind of control in a page with raw elements, hand-drawn appearance, or custom interactions.
- When close to the requirement, extend the original component's parameters or slots rather than copying it into a feature directory; add a component only when reuse is impossible.
- Adjust components wrapped by the design system through public parameters, slots, and style variables.
- If those are insufficient, extend the shared component rather than reaching into its internal structure or overriding the underlying library's internal class names.
- Put general controls shared across desktop renderer pages in `packages/ui/components` (general mobile controls stay in `apps/mobile/`), and business interfaces in the corresponding feature directory under `packages/ui/features`.
- Interfaces belonging only to the desktop workbench framework stay in `apps/desktop`.
- Put global theme overrides in the project's theme style entry point; keep component-local styles locally scoped.

```tsx
// Correct: reuse an existing control through its public parameters and event interfaces.
<Button disabled={isSaving} onClick={save}>
  {t('actions.save')}
</Button>

// Incorrect: recreate appearance, click, and keyboard behavior on a page despite an available button.
<div role="button" onClick={save} className="custom-save-control">
  {t('actions.save')}
</div>
```

- shadcn primitives exist in only one workspace, which owns the primary `components.json`, the primitive files, and the global style entry point: `packages/ui/components`.
- Workspaces that need the CLI to add blocks or composite components (such as `packages/ui/features`) each own a `components.json`; its `style`, `iconLibrary`, and `baseColor` match the primary one, and the `ui` alias points to the public exports of `packages/ui/components`.
- Do not copy primitives into other packages.
- Files introduced by the CLI are third-party source, not generated files: preserve the CLI's filenames and code style, exclude that directory from formatting and filename checks, and explain the exclusion in these rules.
- These files may be changed as needed; explain each change in the PR.
- Before updating to an upstream version, check local changes with the CLI's diff preview rather than overwriting them directly.

- Use VS Code workbench part names for the desktop window framework and its regions (Workbench, Titlebar, ActivityBar, Sidebar, Panel, AuxiliaryBar, StatusBar; use shadcn `ResizableHandle` or Sash for draggable separators between regions).
- Part components have a `Part` suffix to avoid conflicts with primitives of the same name in `packages/ui/components`.
- Use one name for the same region across code, style tokens, tests, and documentation.
- In this repository, shell means a command shell or the Electron `shell` module, not the UI framework.
- Define semantic color tokens per part (such as `--sidebar`), not a single color for the entire framework.

- Components expose only parameters actually used; do not add shared-component parameters for one-off visual differences.
- A new visual pattern is a design-system change: raise the gap and confirm with design, rather than imitating it in feature code.
- Wrapper components forward remaining props, `ref`, and children without cutting off consumer extension points.
- Use icons through wrappers in the shared component layer; do not inline SVG in feature code or represent UI states with emoji.
- When existing icons are unsuitable, choose from the project's icon library, preserve original path data, and adjust only attributes such as stroke width.
- Use the font roles defined by the design system; do not add font files, `@font-face`, or literal font names in feature code.

- If the project has design tokens or style mixins, reuse their spacing, corner radii, font sizes, and shadows instead of scattering equivalent values across pages; confirm names are defined before use.
- Choose theme tokens by semantic responsibility, not current color, and do not borrow tokens with unrelated responsibilities.
- If a responsibility has no token, extend the theme definitions before using it; update schema, defaults, parsing, and types together when the theme system includes them.
- When changing public theme tokens, verify affected components and the project's supported light, dark, and custom-theme fallback paths.
- Prefer design tokens for renderer spacing; local rem values are allowed only when no suitable token exists.
- Do not use hardcoded px values or evade existing tokens or spacing standards by converting px to rem.
- With Tailwind CSS, spacing, radius, font-size, and similar scales in the theme configuration count as design tokens.
- Do not bypass them with arbitrary-value classes (such as `p-[13px]`); combine conditional classes with `cn` publicly exported by `packages/ui/components`, not manually concatenated strings.

Correct: use defined tokens with matching semantics.

```text
Card.padding = spacing.panelInset
Card.radius = radius.panel
```

Incorrect: scatter the same values across pages despite suitable existing tokens.

```text
OrdersCard.padding = 24px
BillingCard.padding = 24px
```

- Write complete literal Tailwind class names; do not construct them dynamically by concatenation (such as `` `bg-${tone}-500` ``), or the classes will neither be generated nor searchable.
- Prefer logical-direction layout properties (`ps-`, `pe-`, `ms-`, `me-`) to support right-to-left languages.
- Feature styles describe only layout (position, width constraints, spacing, wrapping), without overriding shared controls' appearance (height, padding, font, colors, borders, shadows, or hover, focus, and disabled states).
- Do not use deeper selectors, inline styles, or `!important` to change appearance; do not repurpose a component and undo its styles, such as using menu items as a form.
- When changing a shared container's `position`, `transform`, `contain`, or `overflow`, check descendants' positioning reference, overlays, and clipping.
- Review control-style changes in light and dark themes, narrow layouts, and large text.

- If the project has animation standards, reuse their durations, easing curves, and implementations instead of redefining the same parameters across pages. Choose duration by animation type and changes in position and size, rather than fixing all animations to one value. Respect users' reduced-motion settings by limiting or disabling animation.

- Interfaces must remain usable in narrow windows and side-by-side panels: adapt layout to container width (container queries), not viewport breakpoints; wrap or truncate content rather than clipping it; stack regions vertically when they do not fit side by side.
- Before completion, render in a headless browser and inspect at container widths of at least 360, 768, and 1280 CSS pixels.
- When no headless browser is available, report these widths as unverified.
- Use stable, unique list `key` values, not array indices.
- Paginate or virtualize lists that may keep growing (such as conversation history).

- Interfaces must meet WCAG 2.2 A and AA: body text contrast is at least 4.5:1, and large text and non-text elements such as icons, focus indicators, and input borders are at least 3:1.
- Renderer pointer targets meet WCAG 2.5.8's 24x24 CSS pixels or its spacing, equivalent-control, inline-target, user-agent-control, and essential-presentation exceptions.
- Content remains usable at 200% text enlargement; ordinary horizontally written content reflows at an equivalent width of 320 CSS pixels without requiring two-dimensional scrolling, with essential two-dimensional layouts handled under the standard's exceptions.
- Interfaces also support the system's forced-colors mode.
- Interactive elements support keyboard operation and visible focus; icon-only buttons have accessible names; state is not conveyed by color alone.
- Preserve accessibility behavior when reusing controls.
- Use the existing focus management and Escape-to-close behavior of dialog, drawer, and popover components rather than rewriting it in pages.
- Use semantic elements in slots, not plain divs imitating buttons.
- Prefer semantic elements and add ARIA only when native semantics are insufficient; nest heading levels in order without skipping levels.
- Placeholders must not be the only labels; associate field errors with `aria-describedby` and do not use live regions for individual-field validation.
- Automatically updating content such as streaming output and progress can be paused or stopped and notifies assistive technology at a moderate rate, not character by character. The team decides whether an image is decorative or informative; ask when uncertain. Cite the relevant standard when recommending accessibility changes, and state uncertainty when applicable.

- Renderer hover hints use the shared Tooltip component, not the `title` attribute.
- If an `iframe` needs `title` as its accessible name, use the single-line exception under "Development process" in [Working agreement and development process](../chorus-workflow/SKILL.md#working-agreement-and-development-process) and explain why.
- Add hints only to focusable interactive elements, and do not place information essential to completing an action in them; put essential explanations in visible UI text or an interactive popover.
- An icon-only button's accessible name and tooltip text come from the same translation key; the tooltip does not replace an accessible name.
- Oxlint `react/forbid-dom-props` checks `title` on DOM elements; component props are checked in review.

- React interfaces follow React's rules: do not mutate props, state, or external variables while rendering; call hooks only at the top level of components and custom hooks, with complete dependencies.
- Interfaces with React Compiler enabled rely on the compiler for ordinary memoization.
- Do not preemptively add `useMemo`, `useCallback`, or `React.memo` for performance; add them only when measurements show a benefit or an external API requires stable references.
- Investigate and fix compiler or `react-hooks` errors rather than hiding them by disabling rules.
- To investigate compiler compatibility, the official temporary `"use no memo"` approach is allowed; record reproduction and evidence, remove it after the fix, and verify again.

- Prefer state updates in event handlers, not forwarding through `useEffect`; do not use `useEffect` to synchronize values derivable from existing props or state.
- Keep one source for each state, without synchronizing back and forth between local copies and URLs, props, or global stores.
- Global stores contain only data shared across components or requiring caching or persistence; keep them normalized and minimal, without storing derivable values.
- For asynchronous searches, filters, and similar results that newer requests may supersede, accept responses only from the latest request.

- Dialogs and drawers containing data entered by the user request confirmation before unintended closure, including backdrop clicks, Escape, or the close button.
- Do not intercept explicit Cancel or Save buttons, or read-only viewers.
- Handle global errors such as expired authentication and unavailable services centrally at the application root (on desktop, the application root component exported by `packages/ui/features` and mounted by `apps/desktop`; on mobile, the root layout; for TUI, its application root component), not separately in each page.
- Error and empty states explain what happened and what to do next, and provide actionable controls.

### State and feedback

- Asynchronous interfaces handle loading, empty data, error, and success states separately.
- Show field validation errors beside their fields; when form submission produces validation errors, focus the first error.
- Keep a visible explanation for content errors and offer a retry action when retrying is possible.
- Toasts provide only transient feedback and must not replace field errors or page recovery actions; use existing components consistently.
- Loading placeholders match the structure and dimensions of final content to avoid layout jumps; loading buttons retain their label and display a loading indicator.
- Use a short display delay and minimum visible duration for spinners or skeletons to avoid flicker on fast responses.

## UI packages (packages/ui)

This section applies to `packages/ui/`.

Before changing files in this directory, read [UI development](#ui-development) in full. Before adding or changing user-visible text, translation resources, or files under `packages/ui/i18n/`, also read [Internationalization](../chorus-i18n/SKILL.md#internationalization) in full. Both sections also apply to desktop renderer and mobile UI code outside this directory.
