(*---
description: 'A state-level conjunct combined with a primed one is level 2: rejected before any state.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE implied_init_with_primed_conj_rejected ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x = 0 /\ x' = 1
====

(*--- recorded
all:
  exit: 151
  transcript: "2272:1 The formula line 16, col 18 to line 16, col 23 of module implied_init_with_primed_conj_rejected at line 16, col 18 to line 16, col 23 of module implied_init_with_primed_conj_rejected is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action line 16, col 18 to line 16, col 23 of module implied_init_with_primed_conj_rejected holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 16, col 18 to line 16, col 23 of module implied_init_with_primed_conj_rejected; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html)."
---*)
