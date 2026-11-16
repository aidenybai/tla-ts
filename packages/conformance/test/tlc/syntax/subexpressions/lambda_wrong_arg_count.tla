(*---
description: "A LAMBDA's !(...) needs its arity of arguments."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE lambda_wrong_arg_count ----
Ap(F(_), x) == F(x)
Op == Ap(LAMBDA x : x = 1, 1)
Test == Op!1!(1, 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 14 to line 10, col 19 of module lambda_wrong_arg_count
    | Selector with 2 arguments used for LAMBDA expression taking 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
