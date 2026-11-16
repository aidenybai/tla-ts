(*---
description: A property that is an action formula without [] is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY P
---*)
---- MODULE bare_action ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x
P == x' = x
====

(*--- recorded
all:
  exit: 151
  transcript: "2272:1 The formula P at line 15, col 6 to line 15, col 11 of module bare_action is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action P holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 15, col 6 to line 15, col 11 of module bare_action; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html)."
---*)
