(*---
description: 'The angle form is seen through definitions.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE action_level_angle_named_inner ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
An == <<Next>>_x
Prop == An
====

(*--- recorded
all:
  exit: 151
  transcript: 2274:1 The formula An at line 16, col 7 to line 16, col 16 of module action_level_angle_named_inner is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that infinitely many An steps occur, define a temporal property by applying the "always eventually" temporal operator combination ([]<>) to the formula at line 16, col 7 to line 16, col 16 of module action_level_angle_named_inner (compare page 91 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
---*)
