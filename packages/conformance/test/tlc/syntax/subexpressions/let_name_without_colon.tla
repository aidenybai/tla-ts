(*---
description: "A plain name selector looks for a label, not a LET definition."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE let_name_without_colon ----
Op == LET a == 3 IN a = 3
Test == Op!a = 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module let_name_without_colon
    | Cannot find label `a'.
    3002:1 Parsing or semantic analysis failed.
---*)
