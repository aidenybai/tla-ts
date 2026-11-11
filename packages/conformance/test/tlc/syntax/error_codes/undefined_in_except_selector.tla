(*---
description: 4200 fires in an EXCEPT selector.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_in_except_selector ----
A == [<<1>> EXCEPT ![Missing] = 1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 22 to line 8, col 28 of module undefined_in_except_selector
    | Unknown operator: `Missing'.
    3002:1 Parsing or semantic analysis failed.
---*)
