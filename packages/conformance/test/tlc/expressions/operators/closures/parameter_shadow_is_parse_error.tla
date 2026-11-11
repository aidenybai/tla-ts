(*---
description: "A binder with the name of an enclosing parameter is a parse error."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE parameter_shadow_is_parse_error ----
EXTENDS Integers
F(x) == \E x \in {1} : TRUE
Test == F(1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module parameter_shadow_is_parse_error
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 9, col 3 to line 9, col 3 of module parameter_shadow_is_parse_error.
    3002:1 Parsing or semantic analysis failed.
---*)
