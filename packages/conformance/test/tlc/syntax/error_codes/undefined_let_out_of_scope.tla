(*---
description: A LET name is out of scope after its IN body.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_let_out_of_scope ----
A == (LET a == 1 IN a) = a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 26 to line 8, col 26 of module undefined_let_out_of_scope
    | Unknown operator: `a'.
    3002:1 Parsing or semantic analysis failed.
---*)
