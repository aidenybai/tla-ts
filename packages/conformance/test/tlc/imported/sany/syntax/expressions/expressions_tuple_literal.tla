(*---
description: Tuple Literal. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/expressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE expressions_tuple_literal ----
op == <<a, <<b, c>>>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 9 to line 9, col 9 of module expressions_tuple_literal
    | Unknown operator: `a'.
    | line 9, col 14 to line 9, col 14 of module expressions_tuple_literal
    | Unknown operator: `b'.
    | line 9, col 17 to line 9, col 17 of module expressions_tuple_literal
    | Unknown operator: `c'.
    3002:1 Parsing or semantic analysis failed.
---*)
