(*---
description: An undefined postfix operator standing alone is reported as an unknown operator.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [operators]
outcome: parse-error
---*)
---- MODULE postfix_alone_undefined ----
Test == {^+, ^*, ^#} = {} /\ ^#(1) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 8, col 10 to line 8, col 11 of module postfix_alone_undefined
    | Unknown operator: `^+'.
    | line 8, col 14 to line 8, col 15 of module postfix_alone_undefined
    | Unknown operator: `^*'.
    | line 8, col 18 to line 8, col 19 of module postfix_alone_undefined
    | Unknown operator: `^#'.
    | line 8, col 30 to line 8, col 31 of module postfix_alone_undefined
    | Unknown operator: `^#'.
    3002:1 Parsing or semantic analysis failed.
---*)
