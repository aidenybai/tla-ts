(*---
description: Multiple nested record updates with mixed dot/function syntax. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/except.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE except_multiple_nested_record_updates_with_mixed_dot_function_syntax ----
r == [a EXCEPT !.a.b["c"] = "b", ![2].x = @]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module except_multiple_nested_record_updates_with_mixed_dot_function_syntax
    | Unknown operator: `a'.
    3002:1 Parsing or semantic analysis failed.
---*)
