(*---
description: "Self-reference without a RECURSIVE declaration is a parse error."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE undeclared_recursion ----
EXTENDS Integers
F(n) == IF n = 0 THEN 0 ELSE F(n - 1)
Test == F(1) = 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 30 to line 9, col 30 of module undeclared_recursion
    | Unknown operator: `F'.
    3002:1 Parsing or semantic analysis failed.
---*)
