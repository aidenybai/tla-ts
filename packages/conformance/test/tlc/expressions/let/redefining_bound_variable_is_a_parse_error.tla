(*---
description: "A LET definition cannot reuse the name of an enclosing bound variable."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE redefining_bound_variable_is_a_parse_error ----
EXTENDS Integers
Test == \A x \in {1} : LET x == 2 IN x = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 28 to line 9, col 33 of module redefining_bound_variable_is_a_parse_error
    | Operator x already defined or declared.
    | line 9, col 28 to line 9, col 33 of module redefining_bound_variable_is_a_parse_error
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 9, col 12 to line 9, col 12 of module redefining_bound_variable_is_a_parse_error.
    3002:1 Parsing or semantic analysis failed.
---*)
