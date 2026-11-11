(*---
description: 'An IF is not decomposed, and its level is the max of its parts.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE action_level_if ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == IF x = 0 THEN x' = x ELSE x' = x
====

(*--- recorded
all:
  exit: 151
  transcript: "2272:1 The formula Prop at line 16, col 9 to line 16, col 40 of module action_level_if is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action Prop holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 16, col 9 to line 16, col 40 of module action_level_if; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html)."
---*)
