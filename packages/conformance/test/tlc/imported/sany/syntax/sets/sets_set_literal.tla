(*---
description: Set Literal. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_set_literal ----
op == {
  TRUE,
  FALSE,
  ((1 + 2) * 3),
  {1,2,3}
}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 12, col 12 to line 12, col 12 of module sets_set_literal
    | Could not find declaration or definition of symbol '*'.
    | line 12, col 4 to line 12, col 14 of module sets_set_literal
    | Couldn't resolve infix operator symbol `*'.
    3002:1 Parsing or semantic analysis failed.
---*)
