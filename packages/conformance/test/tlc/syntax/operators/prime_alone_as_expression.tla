(*---
description: "' standing alone is the built-in prime used as an expression, so it needs an argument."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [operators]
outcome: parse-error
---*)
---- MODULE prime_alone_as_expression ----
Test == {'} = <<', 1>> /\ '' = '
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 8, col 10 to line 8, col 10 of module prime_alone_as_expression
    | The operator ' requires 1 arguments.
    | line 8, col 17 to line 8, col 17 of module prime_alone_as_expression
    | The operator ' requires 1 arguments.
    | line 8, col 27 to line 8, col 27 of module prime_alone_as_expression
    | The operator ' requires 1 arguments.
    | line 8, col 32 to line 8, col 32 of module prime_alone_as_expression
    | The operator ' requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
