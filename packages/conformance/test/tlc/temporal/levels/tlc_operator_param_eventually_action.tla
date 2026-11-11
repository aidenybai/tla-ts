(*---
description: 'SANY lets an action argument through a parameter under <>, and classifyExpr rejects it.'
ref: tlc2/tool/liveness/Liveness.java#classifyExpr
features: [liveness, levels]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE tlc_operator_param_eventually_action ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
F(a) == <>a
Prop == F(x' = 1)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
