(*---
description: "One quantifier cannot bind the same name twice."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE duplicate_variable_is_a_parse_error ----
EXTENDS Integers
Test == \E x, x \in 1..2 : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 15 to line 9, col 15 of module duplicate_variable_is_a_parse_error
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 9, col 12 to line 9, col 12 of module duplicate_variable_is_a_parse_error.
    3002:1 Parsing or semantic analysis failed.
---*)
