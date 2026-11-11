(*---
description: "!(...) needs one argument per bound name, counted across a shared bound."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE quantifier_too_few_args ----
Op == \A x, y \in {1} : x = y
Test == Op!(2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 14 of module quantifier_too_few_args
    | Selector with 1 argument(s) used for quantifier with 2 bound identifier(s).
    3002:1 Parsing or semantic analysis failed.
---*)
