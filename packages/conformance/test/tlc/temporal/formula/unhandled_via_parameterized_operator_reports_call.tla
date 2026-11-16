(*---
description: 'The same swallowing applies to a parameterized operator.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE unhandled_via_parameterized_operator_reports_call ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Bad(n) == <>(x = n) <=> <>(x = 2)
Prop == Bad(1) \/ <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 17, col 9 to line 17, col 14 of module unhandled_via_parameterized_operator_reports_call
---*)
