(*---
description: 'A square-action conjunct reports the square-specific message.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE action_level_square_conjunct ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x = 0 /\ [Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2273:1 The formula line 16, col 18 to line 16, col 25 of module action_level_square_conjunct at line 16, col 18 to line 16, col 25 of module action_level_square_conjunct is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action line 16, col 18 to line 16, col 25 of module action_level_square_conjunct holds in *every* step of the behavior, define a temporal property by applying the "always" temporal operator ([]) to the formula at line 16, col 18 to line 16, col 25 of module action_level_square_conjunct (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
---*)
