(*---
description: Unicode Operator Declarations as Parameters. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/operators-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_unicode_unicode_operator_declarations_as_parameters ----
op(
  □ _,
  ◇ _,
  ¬ _,
  _ ≈ _,
  _ ≔ _,
  _ ≍ _,
  _ ◯ _,
  _ ⩴ _,
  _ ● _,
  _ ∩ _,
  _ ⋅ _,
  _ ∘ _,
  _ ≅ _,
  _ ∪ _,
  _ ÷ _,
  _ ≐ _,
  _ ‥ _,
  _ … _,
  _ ≡ _,
  _ ‼ _,
  _ ≥ _,
  _ ≫ _,
  _ ⇔ _,
  _ ⇒ _,
  _ ∈ _,
  _ ∧ _,
  _ ⫤ _,
  _ ↝ _,
  _ ≤ _,
  _ ≪ _,
  _ ∨ _,
  _ ⊣ _,
  _ ≠ _,
  _ ∉ _,
  _ ⊙ _,
  _ ⊖ _,
  _ ⊕ _,
  _ ⊘ _,
  _ ⊗ _,
  _ ⇸ _,
  _ ≺ _,
  _ ⪯ _,
  _ ∝ _,
  _ ⁇ _,
  _ ⊨ _,
  _ ⊢ _,
  _ ∼ _,
  _ ≃ _,
  _ ⊓ _,
  _ ⊔ _,
  _ ⊏ _,
  _ ⊑ _,
  _ ⊐ _,
  _ ⊒ _,
  _ ⋆ _,
  _ ⊂ _,
  _ ⊆ _,
  _ ≻ _,
  _ ⪰ _,
  _ ⊃ _,
  _ ⊇ _,
  _ × _,
  _ ⊎ _,
  _ ‖ _,
  _ ≀ _,
  _ ⁺
) ≜ 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 15
    | line 19, col 3 to line 19, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \intersect is a built-in operator, and cannot be redefined.
    | line 20, col 3 to line 20, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \cdot is a built-in operator, and cannot be redefined.
    | line 23, col 3 to line 23, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \union is a built-in operator, and cannot be redefined.
    | line 28, col 3 to line 28, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \equiv is a built-in operator, and cannot be redefined.
    | line 32, col 3 to line 32, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \equiv is a built-in operator, and cannot be redefined.
    | line 33, col 3 to line 33, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol => is a built-in operator, and cannot be redefined.
    | line 34, col 3 to line 34, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \in is a built-in operator, and cannot be redefined.
    | line 35, col 3 to line 35, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \land is a built-in operator, and cannot be redefined.
    | line 37, col 3 to line 37, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol ~> is a built-in operator, and cannot be redefined.
    | line 40, col 3 to line 40, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \lor is a built-in operator, and cannot be redefined.
    | line 42, col 3 to line 42, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol /= is a built-in operator, and cannot be redefined.
    | line 43, col 3 to line 43, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \notin is a built-in operator, and cannot be redefined.
    | line 49, col 3 to line 49, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol -+-> is a built-in operator, and cannot be redefined.
    | line 66, col 3 to line 66, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \subseteq is a built-in operator, and cannot be redefined.
    | line 71, col 3 to line 71, col 7 of module operators_unicode_unicode_operator_declarations_as_parameters
    | Symbol \times is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
