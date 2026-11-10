(*---
description: An operator constant cannot take an expression.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [instance]
outcome: parse-error
---*)
---- MODULE operator_constant_with_expression ----
---- MODULE I ----
CONSTANT F(_)
====
M == INSTANCE I WITH F <- 1 + 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 27 to line 11, col 31 of module operator_constant_with_expression
    | Arity 1 operator (not an expression) is expected 
    | to substitute for CONSTANT 'F'.
    | In module --TLA+ BUILTINS--
    | An operator must be substituted for symbol 'F', and it must have arity 1.
    3002:1 Parsing or semantic analysis failed.
---*)
