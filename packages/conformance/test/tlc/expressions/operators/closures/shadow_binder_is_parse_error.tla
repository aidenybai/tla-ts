(*---
description: "A nested binder with the name of an enclosing one is a parse error, so TLC never shadows."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE shadow_binder_is_parse_error ----
EXTENDS Integers
Test == \A x \in {1} : \A x \in {2} : x = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 27 to line 9, col 27 of module shadow_binder_is_parse_error
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 9, col 12 to line 9, col 12 of module shadow_binder_is_parse_error.
    3002:1 Parsing or semantic analysis failed.
---*)
