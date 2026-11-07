(*---
description: Single nested record update with dot syntax. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/except.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE except_single_nested_record_update_with_dot_syntax ----
r == [a EXCEPT !.x.y.z = "b"]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module except_single_nested_record_update_with_dot_syntax
    | Unknown operator: `a'.
    3002:1 Parsing or semantic analysis failed.
---*)
