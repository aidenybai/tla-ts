(*---
description: "!(...) needs one argument per bound name."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE quantifier_too_many_args ----
Op == \A x \in {1} : x = 2
Test == Op!(2, 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 17 of module quantifier_too_many_args
    | Selector with 2 argument(s) used for quantifier with 1 bound identifier(s).
    3002:1 Parsing or semantic analysis failed.
---*)
