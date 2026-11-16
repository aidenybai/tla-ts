(*---
description: 'A bare action is TLC_CONFIG_PROPERTY_ACTION_LEVEL, naming the property and its location.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE action_level_plain ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x' = x + 1
====

(*--- recorded
all:
  exit: 151
  transcript: "2272:1 The formula Prop at line 16, col 9 to line 16, col 18 of module action_level_plain is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action Prop holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 16, col 9 to line 16, col 18 of module action_level_plain; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html)."
---*)
