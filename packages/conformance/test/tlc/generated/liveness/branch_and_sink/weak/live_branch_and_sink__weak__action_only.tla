(*---
description: Checks action_only on the branch_and_sink machine under weak fairness.
ref: tlc2/tool/liveness/LiveCheck.java; tlc2/tool/liveness/Liveness.java
features:
  - liveness
outcome: any
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE live_branch_and_sink__weak__action_only ----
EXTENDS Integers
VARIABLE x
Next == \/ x = 0 /\ x' \in {1, 2}
        \/ x = 1 /\ x' = 0
        \/ x = 2 /\ x' = 2
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x' = x
====

(*--- recorded
all:
  exit: 151
  transcript: "2272:1 The formula Prop at line 19, col 9 to line 19, col 14 of module live_branch_and_sink__weak__action_only is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. To check that action Prop holds in *every* step of the behavior, define a temporal property: Let A be the formula at line 19, col 9 to line 19, col 14 of module live_branch_and_sink__weak__action_only; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html)."
---*)
