(*---
description: A property of the form [A]_v without [] is rejected with a hint.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY P
---*)
---- MODULE box_action_sub ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x
P == [Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2273:1 The formula P at line 15, col 6 to line 15, col 13 of module box_action_sub is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action P holds in *every* step of the behavior, define a temporal property by applying the "always" temporal operator ([]) to the formula at line 15, col 6 to line 15, col 13 of module box_action_sub (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
---*)
