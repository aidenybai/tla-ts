(*---
description: 'PROPERTY <<A>>_v gets its own message suggesting []<>.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE action_level_angle ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <<Next>>_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2274:1 The formula Prop at line 16, col 9 to line 16, col 18 of module action_level_angle is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that infinitely many Prop steps occur, define a temporal property by applying the "always eventually" temporal operator combination ([]<>) to the formula at line 16, col 9 to line 16, col 18 of module action_level_angle (compare page 91 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
---*)
