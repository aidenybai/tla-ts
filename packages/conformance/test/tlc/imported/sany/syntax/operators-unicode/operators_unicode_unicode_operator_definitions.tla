(*---
description: Unicode Operator Definitions. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/operators-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_unicode_unicode_operator_definitions ----
x ≈ y ≜ 0
x ≔ y ≜ 1
x ≍ y ≜ 2
x ◯ y ≜ 3
x ⩴ y ≜ 4
x ● y ≜ 5
x ∩ y ≜ 6
x ⋅ y ≜ 7
x ∘ y ≜ 8
x ≅ y ≜ 9
x ∪ y ≜ 10
x ÷ y ≜ 11
x ≐ y ≜ 12
x ‥ y ≜ 13
x … y ≜ 14
x ≡ y ≜ 15
x ‼ y ≜ 16
x ≥ y ≜ 17
x ≫ y ≜ 18
x ⇔ y ≜ 19
x ⇒ y ≜ 20
x ∈ y ≜ 21
x ∧ y ≜ 22
x ⫤ y ≜ 23
x ↝ y ≜ 24
x ≤ y ≜ 25
x ≪ y ≜ 26
x ∨ y ≜ 27
x ⊣ y ≜ 28
x ≠ y ≜ 29
x ∉ y ≜ 30
x ⊙ y ≜ 31
x ⊖ y ≜ 32
x ⊕ y ≜ 33
x ⊘ y ≜ 34
x ⊗ y ≜ 35
x ⇸ y ≜ 36
x ≺ y ≜ 37
x ⪯ y ≜ 38
x ∝ y ≜ 39
x ⁇ y ≜ 40
x ⊨ y ≜ 41
x ⊢ y ≜ 42
x ∼ y ≜ 43
x ≃ y ≜ 44
x ⊓ y ≜ 45
x ⊔ y ≜ 46
x ⊏ y ≜ 47
x ⊑ y ≜ 48
x ⊐ y ≜ 49
x ⊒ y ≜ 50
x ⋆ y ≜ 51
x ⊂ y ≜ 52
x ⊆ y ≜ 53
x ≻ y ≜ 54
x ⪰ y ≜ 55
x ⊃ y ≜ 56
x ⊇ y ≜ 57
x × y ≜ 58
x ⊎ y ≜ 59
x ‖ y ≜ 60
x ≀ y ≜ 61
□ x ≜ 62
◇ x ≜ 63
¬ x ≜ 64
x ⁺ ≜ 65
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 36
    | line 15, col 1 to line 15, col 9 of module operators_unicode_unicode_operator_definitions
    | Operator \intersect already defined or declared.
    | line 15, col 1 to line 15, col 9 of module operators_unicode_unicode_operator_definitions
    | Symbol \intersect is a built-in operator, and cannot be redefined.
    | line 16, col 1 to line 16, col 9 of module operators_unicode_unicode_operator_definitions
    | Operator \cdot already defined or declared.
    | line 16, col 1 to line 16, col 9 of module operators_unicode_unicode_operator_definitions
    | Symbol \cdot is a built-in operator, and cannot be redefined.
    | line 19, col 1 to line 19, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator \union already defined or declared.
    | line 19, col 1 to line 19, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol \union is a built-in operator, and cannot be redefined.
    | line 24, col 1 to line 24, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator \equiv already defined or declared.
    | line 24, col 1 to line 24, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol \equiv is a built-in operator, and cannot be redefined.
    | line 28, col 1 to line 28, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator \equiv already defined or declared.
    | line 28, col 1 to line 28, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol \equiv is a built-in operator, and cannot be redefined.
    | line 29, col 1 to line 29, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator => already defined or declared.
    | line 29, col 1 to line 29, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol => is a built-in operator, and cannot be redefined.
    | line 30, col 1 to line 30, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator \in already defined or declared.
    | line 30, col 1 to line 30, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol \in is a built-in operator, and cannot be redefined.
    | line 31, col 1 to line 31, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator \land already defined or declared.
    | line 31, col 1 to line 31, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol \land is a built-in operator, and cannot be redefined.
    | line 33, col 1 to line 33, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator ~> already defined or declared.
    | line 33, col 1 to line 33, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol ~> is a built-in operator, and cannot be redefined.
    | line 36, col 1 to line 36, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator \lor already defined or declared.
    | line 36, col 1 to line 36, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol \lor is a built-in operator, and cannot be redefined.
    | line 38, col 1 to line 38, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator /= already defined or declared.
    | line 38, col 1 to line 38, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol /= is a built-in operator, and cannot be redefined.
    | line 39, col 1 to line 39, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator \notin already defined or declared.
    | line 39, col 1 to line 39, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol \notin is a built-in operator, and cannot be redefined.
    | line 45, col 1 to line 45, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator -+-> already defined or declared.
    | line 45, col 1 to line 45, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol -+-> is a built-in operator, and cannot be redefined.
    | line 62, col 1 to line 62, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator \subseteq already defined or declared.
    | line 62, col 1 to line 62, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol \subseteq is a built-in operator, and cannot be redefined.
    | line 67, col 1 to line 67, col 10 of module operators_unicode_unicode_operator_definitions
    | Operator \times already defined or declared.
    | line 67, col 1 to line 67, col 10 of module operators_unicode_unicode_operator_definitions
    | Symbol \times is a built-in operator, and cannot be redefined.
    | line 71, col 1 to line 71, col 8 of module operators_unicode_unicode_operator_definitions
    | Operator [] already defined or declared.
    | line 71, col 1 to line 71, col 8 of module operators_unicode_unicode_operator_definitions
    | Symbol [] is a built-in operator, and cannot be redefined.
    | line 72, col 1 to line 72, col 8 of module operators_unicode_unicode_operator_definitions
    | Operator <> already defined or declared.
    | line 72, col 1 to line 72, col 8 of module operators_unicode_unicode_operator_definitions
    | Symbol <> is a built-in operator, and cannot be redefined.
    | line 73, col 1 to line 73, col 8 of module operators_unicode_unicode_operator_definitions
    | Operator \lnot already defined or declared.
    | line 73, col 1 to line 73, col 8 of module operators_unicode_unicode_operator_definitions
    | Symbol \lnot is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
