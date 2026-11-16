(*---
description: 'An action guard with temporal arms passes SANY, and the expansion of IF puts an action next to a temporal formula: TLC_LIVE_WRONG_FORMULA_FORMAT.'
ref: tlc2/tool/liveness/Liveness.java#classifyExpr
features: [liveness, levels]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE tlc_if_action_guard_with_temporal_branch ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == IF x' = 1 THEN <>(x = 1) ELSE <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2214:1 Temporal formulas containing actions must be of forms <>[]A or []<>A.
---*)
