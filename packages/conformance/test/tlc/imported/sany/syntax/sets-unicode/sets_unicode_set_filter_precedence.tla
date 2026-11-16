(*---
description: Set Filter Precedence. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unicode/sets-unicode.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_unicode_set_filter_precedence ----
op ≜ {x ∈ S : x ∈ T}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 11 to line 9, col 11 of module sets_unicode_set_filter_precedence
    | Unknown operator: `S'.
    | line 9, col 19 to line 9, col 19 of module sets_unicode_set_filter_precedence
    | Unknown operator: `T'.
    3002:1 Parsing or semantic analysis failed.
---*)
