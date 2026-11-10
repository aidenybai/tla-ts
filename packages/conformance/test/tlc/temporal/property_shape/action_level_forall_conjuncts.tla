(*---
description: 'A bounded universal is unrolled, and the first instance is rejected with the name of the body.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE action_level_forall_conjuncts ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == \A n \in {1, 2} : x' = n
====

(*--- recorded
all:
  exit: 151
  transcript: "2272:1 The formula line 16, col 27 to line 16, col 32 of module action_level_forall_conjuncts at line 16, col 27 to line 16, col 32 of module action_level_forall_conjuncts is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action line 16, col 27 to line 16, col 32 of module action_level_forall_conjuncts holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 16, col 27 to line 16, col 32 of module action_level_forall_conjuncts; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html)."
---*)
