(*---
description: '[]<<A>>_v is rejected by SANY as [] not followed by [A]_v.'
ref: tlc2/tool/liveness/Liveness.java#classifyExpr
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE always_angle_action_rejected ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == []<<Next>>_x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 9 to line 16, col 20 of module always_angle_action_rejected
    | [] followed by action not of form [A]_v.
    3002:1 Parsing or semantic analysis failed.
---*)
