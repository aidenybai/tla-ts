(*---
description: Label With Parameters. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/labels-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE labels_unicode_label_with_parameters ----
op ≜ ∀ a, b ∈ ℕ : lbl(a, b) ∷ P(a, b)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 15 to line 9, col 15 of module labels_unicode_label_with_parameters
    | Unknown operator: `ℕ'.
    | line 9, col 31 to line 9, col 31 of module labels_unicode_label_with_parameters
    | Unknown operator: `P'.
    3002:1 Parsing or semantic analysis failed.
---*)
