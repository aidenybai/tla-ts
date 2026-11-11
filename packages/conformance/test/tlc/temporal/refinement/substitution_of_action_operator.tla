(*---
description: 'A temporal argument to an operator constant replaced by a definition is rejected: the lookup yields an OpLambdaValue, so it is never expanded and its level is temporal.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness, refinement]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE substitution_of_action_operator ----
EXTENDS Naturals
VARIABLE x
---- MODULE Ops ----
EXTENDS Naturals
VARIABLE v
CONSTANT Combine(_, _)
G == Combine(<>(v = 1), <>(v = 2))
====
N == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][N]_x /\ WF_x(N)
Both(a, b) == a /\ b
O == INSTANCE Ops WITH v <- x, Combine <- Both
Prop == O!G
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 18, col 6 to line 18, col 34 of module substitution_of_action_operator
---*)
