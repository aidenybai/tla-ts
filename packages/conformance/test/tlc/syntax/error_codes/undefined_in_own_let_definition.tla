(*---
description: A LET definition cannot use itself without RECURSIVE.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_in_own_let_definition ----
A == LET a == a IN 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 15 to line 8, col 15 of module undefined_in_own_let_definition
    | Unknown operator: `a'.
    3002:1 Parsing or semantic analysis failed.
---*)
