(*---
description: An ASSUME/PROVE theorem cannot be used as an expression.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE assume_prove_as_expression ----
THEOREM T == ASSUME 1 = 1 PROVE 2 = 2
Test == T
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 9 to line 9, col 9 of module assume_prove_as_expression
    | ASSUME/PROVE used where an expression is required.
    3002:1 Parsing or semantic analysis failed.
---*)
