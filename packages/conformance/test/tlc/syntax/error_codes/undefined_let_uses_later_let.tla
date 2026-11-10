(*---
description: A LET definition cannot use a later one without RECURSIVE.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_let_uses_later_let ----
A == LET a == b
         b == 1
     IN a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 15 to line 8, col 15 of module undefined_let_uses_later_let
    | Unknown operator: `b'.
    3002:1 Parsing or semantic analysis failed.
---*)
