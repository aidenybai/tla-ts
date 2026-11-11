(*---
description: 'An angle action on the left of ~> is the same SANY error.'
ref: tlc2/tool/liveness/Liveness.java#classifyExpr
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE leads_to_angle_action_left ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <<Next>>_x ~> x = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 9 to line 16, col 27 of module leads_to_angle_action_left
    | Action used where only temporal formula or state predicate allowed.
    3002:1 Parsing or semantic analysis failed.
---*)
