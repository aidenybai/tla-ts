(*---
description: "Calling an operator with the wrong number of arguments is a parse error."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE wrong_argument_count ----
EXTENDS Integers
F(a) == a
Test == F(1, 2) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 10 to line 10, col 15 of module wrong_argument_count
    | The operator F requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
