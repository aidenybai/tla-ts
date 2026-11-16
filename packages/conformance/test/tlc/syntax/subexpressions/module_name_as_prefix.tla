(*---
description: A module name is not a selector prefix.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE module_name_as_prefix ----
EXTENDS Naturals
Test == Naturals!Nat = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 9 to line 9, col 20 of module module_name_as_prefix
    | Unknown operator: `Naturals!Nat'.
    3002:1 Parsing or semantic analysis failed.
---*)
