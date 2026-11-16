(*---
description: 'SANY accepts a LET-wrapped [A]_v under a box because the argument is not syntactically an action. processConfigProps sees no OPCODE_sa and classifies it as temporal, and classifyExpr then rejects it with TLC_LIVE_WRONG_FORMULA_FORMAT.'
ref: tlc2/tool/liveness/Liveness.java#classifyExpr
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE box_of_let_square_rejected ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [](LET a == Next IN [a]_x)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
