(*---
description: 'A non-Boolean constant in temporal position fails translation with TLC_EXPECTED_VALUE.'
ref: tlc2/tool/liveness/Liveness.java#astToLive
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE non_boolean_constant_in_formula ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == 1 => <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2215:1 TLC expected a boolean value, but did not find one. 1
---*)
