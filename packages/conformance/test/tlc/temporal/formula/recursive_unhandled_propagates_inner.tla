(*---
description: 'A RECURSIVE operator does not swallow: the inner location is reported.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE recursive_unhandled_propagates_inner ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
RECURSIVE Bad(_)
Bad(n) == IF n = 0 THEN <>(x = 1) <=> <>(x = 2) ELSE Bad(n - 1)
Prop == Bad(1) \/ <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 17, col 25 to line 17, col 47 of module recursive_unhandled_propagates_inner
---*)
