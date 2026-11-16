(*---
description: Multiple nested record updates. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/except.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE except_multiple_nested_record_updates ----
r == [a EXCEPT ![2]["a"][3] = @, !["b"][x] = 5, ![y][z] = "c"]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 9, col 7 to line 9, col 7 of module except_multiple_nested_record_updates
    | Unknown operator: `a'.
    | line 9, col 41 to line 9, col 41 of module except_multiple_nested_record_updates
    | Unknown operator: `x'.
    | line 9, col 51 to line 9, col 51 of module except_multiple_nested_record_updates
    | Unknown operator: `y'.
    | line 9, col 54 to line 9, col 54 of module except_multiple_nested_record_updates
    | Unknown operator: `z'.
    3002:1 Parsing or semantic analysis failed.
---*)
