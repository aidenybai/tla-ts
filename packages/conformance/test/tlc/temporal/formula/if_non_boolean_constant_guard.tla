(*---
description: 'A non-Boolean constant guard is not chosen from, and translation fails with TLC_EXPECTED_VALUE.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE if_non_boolean_constant_guard ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == IF 1 THEN <>(x = 2) ELSE <>(x = 99)
====

(*--- recorded
all:
  exit: 255
  transcript: 2215:1 TLC expected a boolean value, but did not find one. 1
---*)
