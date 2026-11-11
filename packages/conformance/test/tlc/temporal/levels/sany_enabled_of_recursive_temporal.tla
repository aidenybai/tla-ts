(*---
description: 'SANY''s level check sees through RECURSIVE, so ENABLED of a temporal recursive operator is rejected before TLC_ENABLED_WRONG_FORMULA.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_enabled_of_recursive_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
RECURSIVE R(_)
R(n) == IF n = 0 THEN <>(x = 1) ELSE R(n - 1)
Prop == [](ENABLED R(0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 18, col 12 to line 18, col 23 of module sany_enabled_of_recursive_temporal
    | Level error in applying operator ENABLED:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
