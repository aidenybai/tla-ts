(*---
description: 'A constant operator replaced by an action in <> passes SANY, and classifyExpr rejects it.'
ref: tlc2/tool/liveness/Liveness.java#classifyExpr
features: [liveness, levels]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTANT Op <- T
---*)
---- MODULE config_operator_action_in_eventually ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
CONSTANT Op(_)
T(a) == x' = 1
Prop == <>Op(TRUE)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
