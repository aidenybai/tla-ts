(*---
description: Unicode Operator References. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/operators-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_unicode_unicode_operator_references ----
op ≜ f(
  □,
  ◇,
  ¬,
  ≈,
  ≔,
  ≍,
  ◯,
  ⩴,
  ●,
  ∩,
  ⋅,
  ∘,
  ≅,
  ∪,
  ÷,
  ≐,
  ‥,
  …,
  ≡,
  ‼,
  ≥,
  ≫,
  ⇔,
  ⇒,
  ∈,
  ∧,
  ⫤,
  ↝,
  ≤,
  ≪,
  ∨,
  ⊣,
  ≠,
  ∉,
  ⊙,
  ⊖,
  ⊕,
  ⊘,
  ⊗,
  ⇸,
  ≺,
  ⪯,
  ∝,
  ⁇,
  ⊨,
  ⊢,
  ∼,
  ≃,
  ⊓,
  ⊔,
  ⊏,
  ⊑,
  ⊐,
  ⊒,
  ⋆,
  ⊂,
  ⊆,
  ≻,
  ⪰,
  ⊃,
  ⊇,
  ×,
  ⊎,
  ‖,
  ≀,
  ⁺
)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 6 of module operators_unicode_unicode_operator_references
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)
