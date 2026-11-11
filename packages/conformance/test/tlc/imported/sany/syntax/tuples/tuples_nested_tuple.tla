(*---
description: Nested Tuple. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/tuples.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE tuples_nested_tuple ----
op == <<<<x, y>>, <<z>>>> 
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 9, col 11 to line 9, col 11 of module tuples_nested_tuple
    | Unknown operator: `x'.
    | line 9, col 14 to line 9, col 14 of module tuples_nested_tuple
    | Unknown operator: `y'.
    | line 9, col 21 to line 9, col 21 of module tuples_nested_tuple
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
