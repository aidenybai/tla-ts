(*---
description: 'An angle action beside a box is rejected by SANY for mixing action and temporal levels.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE angle_action_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ [][Next]_x /\ <<Next>>_x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 9 to line 15, col 40 of module angle_action_conjunct
    | \land has both temporal formula and action as arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
