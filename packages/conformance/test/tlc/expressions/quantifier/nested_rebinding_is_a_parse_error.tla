(*---
description: "A nested quantifier cannot rebind the name of an enclosing variable."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE nested_rebinding_is_a_parse_error ----
EXTENDS Integers
Test == \E x \in 1..2 : \E x \in 1..2 : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 28 to line 9, col 28 of module nested_rebinding_is_a_parse_error
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 9, col 12 to line 9, col 12 of module nested_rebinding_is_a_parse_error.
    3002:1 Parsing or semantic analysis failed.
---*)
