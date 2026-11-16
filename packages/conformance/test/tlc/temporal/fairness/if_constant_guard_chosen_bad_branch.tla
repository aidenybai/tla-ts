(*---
description: 'The taken branch of a constant IF is translated, and a formula astToLive cannot handle fails there.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE if_constant_guard_chosen_bad_branch ----
EXTENDS Naturals
VARIABLE x
A == x < 2 /\ x' = x + 1
Prop == <>(x = 2)

Spec == x = 0 /\ [][A]_x /\ (IF FALSE THEN WF_x(A) ELSE (<>(x = 1) <=> <>(x = 2)))
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 17, col 58 to line 17, col 80 of module if_constant_guard_chosen_bad_branch
---*)
