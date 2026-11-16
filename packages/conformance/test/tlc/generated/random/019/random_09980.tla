(*---
description: Evaluates a random set expression, seed 262, number 9980.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09980 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b15517 \in {((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a : b15518 \in ((2147483647 .. 3) \cup {b15519 \in {2, 1, 3} : FALSE})} : ((<<b15517, 0>> = (b15517 :> 0)) \/ ((SUBSET {1} = SUBSET {1}) /\ (1..3 \subseteq Nat)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
