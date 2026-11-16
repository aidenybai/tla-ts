(*---
description: Evaluates a random bool expression, seed 262, number 5172.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05172 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b8025 \in {1} : FALSE} \cap DOMAIN [x \in 1..2 |-> x]) \cap DOMAIN (1 :> 0)) = DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
