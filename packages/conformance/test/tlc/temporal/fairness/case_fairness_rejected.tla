(*---
description: 'CASE has no temporal translation: TLC_LIVE_CANNOT_HANDLE_FORMULA, even with one guard.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE case_fairness_rejected ----
EXTENDS Naturals
VARIABLE x
A == x < 2 /\ x' = x + 1
Prop == <>(x = 2)

Spec == x = 0 /\ [][A]_x /\ (CASE TRUE -> WF_x(A))
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 17, col 30 to line 17, col 49 of module case_fairness_rejected
---*)
