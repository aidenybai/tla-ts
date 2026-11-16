(*---
description: 'UNCHANGED is action level in a PROPERTY, rejected by TLC_CONFIG_PROPERTY_ACTION_LEVEL.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness, levels]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE tlc_property_unchanged_action_level ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == UNCHANGED x
====

(*--- recorded
all:
  exit: 151
  transcript: "2272:1 The formula Prop at line 16, col 9 to line 16, col 19 of module tlc_property_unchanged_action_level is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action Prop holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 16, col 9 to line 16, col 19 of module tlc_property_unchanged_action_level; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html)."
---*)
