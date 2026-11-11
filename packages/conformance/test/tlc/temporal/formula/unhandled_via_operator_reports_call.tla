(*---
description: 'A definition whose body cannot be translated has its error swallowed by expansion and reported at the call site, not at the inner formula.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE unhandled_via_operator_reports_call ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Bad == <>(x = 1) <=> <>(x = 2)
Prop == Bad /\ <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 16, col 8 to line 16, col 30 of module unhandled_via_operator_reports_call
---*)
