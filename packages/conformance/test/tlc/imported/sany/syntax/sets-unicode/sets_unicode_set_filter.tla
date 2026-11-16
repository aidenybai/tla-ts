(*---
description: Set Filter. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/sets-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_unicode_set_filter ----
op ≜ {x ∈ ℕ : P(x)}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 11 to line 9, col 11 of module sets_unicode_set_filter
    | Unknown operator: `ℕ'.
    | line 9, col 15 to line 9, col 15 of module sets_unicode_set_filter
    | Unknown operator: `P'.
    3002:1 Parsing or semantic analysis failed.
---*)
