(*---
description: Unicode Operator Application. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/operators-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_unicode_unicode_operator_application ----
op ≜ {
  □ x,
  ◇ x,
  ¬ x,
  x ≈ y,
  x ≔ y,
  x ≍ y,
  x ◯ y,
  x ⩴ y,
  x ● y,
  x ∩ y,
  x ⋅ y,
  x ∘ y,
  x ≅ y,
  x ∪ y,
  x ÷ y,
  x ≐ y,
  x ‥ y,
  x … y,
  x ≡ y,
  x ‼ y,
  x ≥ y,
  x ≫ y,
  x ⇔ y,
  x ⇒ y,
  x ∈ y,
  x ∧ y,
  x ⫤ y,
  x ↝ y,
  x ≤ y,
  x ≪ y,
  x ∨ y,
  x ⊣ y,
  x ≠ y,
  x ∉ y,
  x ⊙ y,
  x ⊖ y,
  x ⊕ y,
  x ⊘ y,
  x ⊗ y,
  x ⇸ y,
  x ≺ y,
  x ⪯ y,
  x ∝ y,
  x ⁇ y,
  x ⊨ y,
  x ⊢ y,
  x ∼ y,
  x ≃ y,
  x ⊓ y,
  x ⊔ y,
  x ⊏ y,
  x ⊑ y,
  x ⊐ y,
  x ⊒ y,
  x ⋆ y,
  x ⊂ y,
  x ⊆ y,
  x ≻ y,
  x ⪰ y,
  x ⊃ y,
  x ⊇ y,
  x × y,
  x ⊎ y,
  x ‖ y,
  x ≀ y,
  x ⁺
}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 129
    | line 10, col 5 to line 10, col 5 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 11, col 5 to line 11, col 5 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 12, col 5 to line 12, col 5 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 13, col 5 to line 13, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≈'.
    | line 13, col 3 to line 13, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≈'.
    | line 14, col 5 to line 14, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≔'.
    | line 14, col 3 to line 14, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≔'.
    | line 15, col 5 to line 15, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≍'.
    | line 15, col 3 to line 15, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≍'.
    | line 16, col 5 to line 16, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '◯'.
    | line 16, col 3 to line 16, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `◯'.
    | line 17, col 5 to line 17, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⩴'.
    | line 17, col 3 to line 17, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⩴'.
    | line 18, col 5 to line 18, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '●'.
    | line 18, col 3 to line 18, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `●'.
    | line 19, col 3 to line 19, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 19, col 7 to line 19, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 20, col 3 to line 20, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 20, col 7 to line 20, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 21, col 5 to line 21, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '∘'.
    | line 21, col 3 to line 21, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `∘'.
    | line 22, col 5 to line 22, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≅'.
    | line 22, col 3 to line 22, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≅'.
    | line 23, col 3 to line 23, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 23, col 7 to line 23, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 24, col 5 to line 24, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '÷'.
    | line 24, col 3 to line 24, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `÷'.
    | line 25, col 5 to line 25, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≐'.
    | line 25, col 3 to line 25, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≐'.
    | line 26, col 5 to line 26, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '‥'.
    | line 26, col 3 to line 26, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `‥'.
    | line 27, col 5 to line 27, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '…'.
    | line 27, col 3 to line 27, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `…'.
    | line 28, col 3 to line 28, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 28, col 7 to line 28, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 29, col 5 to line 29, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '‼'.
    | line 29, col 3 to line 29, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `‼'.
    | line 30, col 5 to line 30, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≥'.
    | line 30, col 3 to line 30, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≥'.
    | line 31, col 5 to line 31, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≫'.
    | line 31, col 3 to line 31, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≫'.
    | line 32, col 3 to line 32, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 32, col 7 to line 32, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 33, col 3 to line 33, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 33, col 7 to line 33, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 34, col 3 to line 34, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 34, col 7 to line 34, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 35, col 3 to line 35, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 35, col 7 to line 35, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 36, col 5 to line 36, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⫤'.
    | line 36, col 3 to line 36, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⫤'.
    | line 37, col 3 to line 37, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 37, col 7 to line 37, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 38, col 5 to line 38, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≤'.
    | line 38, col 3 to line 38, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≤'.
    | line 39, col 5 to line 39, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≪'.
    | line 39, col 3 to line 39, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≪'.
    | line 40, col 3 to line 40, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 40, col 7 to line 40, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 41, col 5 to line 41, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊣'.
    | line 41, col 3 to line 41, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊣'.
    | line 42, col 3 to line 42, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 42, col 7 to line 42, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 43, col 3 to line 43, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 43, col 7 to line 43, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 44, col 5 to line 44, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊙'.
    | line 44, col 3 to line 44, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊙'.
    | line 45, col 5 to line 45, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊖'.
    | line 45, col 3 to line 45, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊖'.
    | line 46, col 5 to line 46, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊕'.
    | line 46, col 3 to line 46, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊕'.
    | line 47, col 5 to line 47, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊘'.
    | line 47, col 3 to line 47, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊘'.
    | line 48, col 5 to line 48, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊗'.
    | line 48, col 3 to line 48, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊗'.
    | line 49, col 3 to line 49, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 49, col 7 to line 49, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 50, col 5 to line 50, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≺'.
    | line 50, col 3 to line 50, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≺'.
    | line 51, col 5 to line 51, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⪯'.
    | line 51, col 3 to line 51, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⪯'.
    | line 52, col 5 to line 52, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '∝'.
    | line 52, col 3 to line 52, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `∝'.
    | line 53, col 5 to line 53, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⁇'.
    | line 53, col 3 to line 53, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⁇'.
    | line 54, col 5 to line 54, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊨'.
    | line 54, col 3 to line 54, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊨'.
    | line 55, col 5 to line 55, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊢'.
    | line 55, col 3 to line 55, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊢'.
    | line 56, col 5 to line 56, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '∼'.
    | line 56, col 3 to line 56, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `∼'.
    | line 57, col 5 to line 57, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≃'.
    | line 57, col 3 to line 57, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≃'.
    | line 58, col 5 to line 58, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊓'.
    | line 58, col 3 to line 58, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊓'.
    | line 59, col 5 to line 59, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊔'.
    | line 59, col 3 to line 59, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊔'.
    | line 60, col 5 to line 60, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊏'.
    | line 60, col 3 to line 60, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊏'.
    | line 61, col 5 to line 61, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊑'.
    | line 61, col 3 to line 61, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊑'.
    | line 62, col 5 to line 62, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊐'.
    | line 62, col 3 to line 62, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊐'.
    | line 63, col 5 to line 63, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊒'.
    | line 63, col 3 to line 63, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊒'.
    | line 64, col 5 to line 64, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⋆'.
    | line 64, col 3 to line 64, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⋆'.
    | line 65, col 5 to line 65, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊂'.
    | line 65, col 3 to line 65, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊂'.
    | line 66, col 3 to line 66, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 66, col 7 to line 66, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 67, col 5 to line 67, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≻'.
    | line 67, col 3 to line 67, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≻'.
    | line 68, col 5 to line 68, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⪰'.
    | line 68, col 3 to line 68, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⪰'.
    | line 69, col 5 to line 69, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊃'.
    | line 69, col 3 to line 69, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊃'.
    | line 70, col 5 to line 70, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊇'.
    | line 70, col 3 to line 70, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊇'.
    | line 71, col 3 to line 71, col 3 of module operators_unicode_unicode_operator_application
    | Unknown operator: `x'.
    | line 71, col 7 to line 71, col 7 of module operators_unicode_unicode_operator_application
    | Unknown operator: `y'.
    | line 72, col 5 to line 72, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⊎'.
    | line 72, col 3 to line 72, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `⊎'.
    | line 73, col 5 to line 73, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '‖'.
    | line 73, col 3 to line 73, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `‖'.
    | line 74, col 5 to line 74, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '≀'.
    | line 74, col 3 to line 74, col 7 of module operators_unicode_unicode_operator_application
    | Couldn't resolve infix operator symbol `≀'.
    | line 75, col 5 to line 75, col 5 of module operators_unicode_unicode_operator_application
    | Could not find declaration or definition of symbol '⁺'.
    | line 75, col 3 to line 75, col 5 of module operators_unicode_unicode_operator_application
    | Couldn't resolve postfix operator symbol `⁺'.
    3002:1 Parsing or semantic analysis failed.
---*)
