(*---
description: '[][A]_v \/ <>P keeps the action in a disjunct under one temporal operator, which classifyExpr rejects.'
ref: tlc2/tool/liveness/Liveness.java#classifyExpr
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE always_square_or_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [][Next]_x \/ <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
