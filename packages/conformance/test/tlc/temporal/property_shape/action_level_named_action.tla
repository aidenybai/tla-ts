(*---
description: 'A property that is a defined action is expanded first, so the message names that definition.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE action_level_named_action ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == Next
====

(*--- recorded
all:
  exit: 151
  transcript: "2272:1 The formula line 14, col 18 to line 14, col 27 of module action_level_named_action at line 14, col 18 to line 14, col 27 of module action_level_named_action is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action line 14, col 18 to line 14, col 27 of module action_level_named_action holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 14, col 18 to line 14, col 27 of module action_level_named_action; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html)."
---*)
