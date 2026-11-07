(*---
description: A NEW clause is not an expression.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE assume_prove_new_declaration ----
THEOREM T == ASSUME NEW x, x = 1 PROVE x = 1
Test == T!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 9 to line 9, col 11 of module assume_prove_new_declaration
    | Selected a NEW declaration as an expression or operator.
    3002:1 Parsing or semantic analysis failed.
---*)
