(*---
description: '<>WF_x(A) nests an action inside two temporal operators in a form classifyExpr rejects with TLC_LIVE_WRONG_FORMULA_FORMAT.'
ref: tlc2/tool/liveness/Liveness.java#classifyExpr
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE eventually_of_fairness ----
EXTENDS Naturals
VARIABLE x
A == x < 2 /\ x' = x + 1
Prop == <>(x = 2)

Spec == x = 0 /\ [][A]_x /\ <>WF_x(A)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
