(*---
description: 'A formula with no translation fails at startup in simulation too.'
ref: tlc2/tool/Simulator.java#Simulator
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -simulate
  - num=8
  - -depth
  - 6
---*)
---- MODULE simulate_translation_error_at_startup ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>(x = 1) <=> <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 21, col 9 to line 21, col 31 of module simulate_translation_error_at_startup
---*)
