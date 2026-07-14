# Conventions — Victor Eriksson Resume DS

**What ships here: styles, tokens, and fonts only — no component bundle.** Build screens from your own markup and style them exclusively with the tokens, classes, and fonts below. Everything loads automatically through `styles.css`; there is no provider or wrapper to set up.

## Styling idiom: CSS custom properties

Style with `var(--token)` values, never hard-coded hex. Two palettes coexist — pick by context:

**Product / dashboard screens** (the default; `body` already uses this background):

- Surfaces: page `var(--appBg)`, cards `var(--bgCard)` with `border-radius: var(--radius)`, card divider `var(--cardDivider)`, borders `var(--borderColor)`, tag/input borders `var(--borderTag)`
- Text: `var(--textColor)` primary, `var(--grayToGray)` secondary/muted
- Accents: links and primary actions `var(--linkColor)`, teal accent `var(--secondaryButtonGreen)`, errors `var(--error)`, disabled `var(--colorDisabled)`
- Chrome: modal header `var(--modalHeader)`, menu hover `var(--hoverItemMenu)`, scrollbars `var(--scrollbar-track)` / `var(--scrollbar-thumb)`
- Type: `'Source Sans Pro', sans-serif`, 14px base, uppercase button labels

**Resume / editorial pages** (paper-on-desk look):

- Page `var(--page-bg)`, sheet `var(--paper)`, body text `var(--ink)`, hairlines `var(--rule)`
- Gold accent `var(--gold)` (text/lines) and `var(--gold-fill)` (fills), progress track `var(--track)`
- Dark sidebar `var(--sidebar-bg)` with `var(--sidebar-text)` and `var(--sidebar-muted)`, darker block `var(--education-bg)`
- Type: `'Roboto'` body; `'Dancing Script'` weight 700 for signature-style display accents
- Animations pace with `var(--line-duration)`

## Buttons

Use the shipped classes rather than restyling from scratch: `.primary-button` (filled indigo), `.secondary-button` (outlined indigo), `.delete-button` (outlined red, fills red on hover). All are 40px tall, 10px radius, uppercase, Source Sans Pro. Disable with the `disabled` attribute.

## Icons

Ligature icon fonts are bundled — the element's text is the icon name:

```html
<span class="material-symbols-outlined">insights</span>
<span class="material-icons">check_circle</span>
<span class="material-icons-outlined">info</span>
```

## Where the truth lives

Read before styling: `styles.css` (base rules and button classes), `tokens/tokens.css` (every custom property), `fonts/fonts.css` (families and weights: Roboto variable 300–700, Source Sans Pro 300/400/600/700, Dancing Script 700, plus the three Material icon families).

## Idiomatic example

```html
<div style="background: var(--bgCard); border: 1px solid var(--borderColor); border-radius: var(--radius); padding: 16px; font-family: 'Source Sans Pro', sans-serif; color: var(--textColor);">
  <span class="material-symbols-outlined" style="color: var(--linkColor)">insights</span>
  <h3 style="margin: 4px 0">Sessions</h3>
  <p style="margin: 0; color: var(--grayToGray)">Last 30 days</p>
  <button class="primary-button" style="margin-top: 12px">View report</button>
</div>
```
