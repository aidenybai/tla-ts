(*---
description: 'Without parentheses the operator after ]_ is seen with no arguments, which SANY rejects.'
ref: tla2sany/semantic/Generator.java
features: [liveness, subscript]
outcome: parse-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE operator_application_needs_parens ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 1 /\ x' = x + 1 /\ y' = y
V(a) == <<a, y>>
Spec == Init /\ [][Next]_V(x)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 26 to line 16, col 26 of module operator_application_needs_parens
    | The operator V requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
