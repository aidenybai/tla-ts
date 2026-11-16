(*---
description: "A LET definition cannot refer to a later definition in the same LET."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE forward_reference_is_a_parse_error ----
EXTENDS Integers
Test == LET a == b  b == 1 IN a = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 18 to line 9, col 18 of module forward_reference_is_a_parse_error
    | Unknown operator: `b'.
    3002:1 Parsing or semantic analysis failed.
---*)
