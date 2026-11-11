(*---
description: Evaluates a random bool expression, seed 262, number 3822.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03822 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((\A b6021 \in {2, 1, 3} : TRUE) => (\A b6022 \in 1..3 : FALSE)) /\ (((1 :> 2) @@ <<5, 6>>) /\ (0 = -1))) /\ [a |-> ((<<1, 2>> - 2) - (2 \div 3)), b |-> ((CHOOSE f \in [{} -> 1..2] : TRUE) \/ (FALSE \/ TRUE))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
