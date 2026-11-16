(*---
description: Evaluates a random bool expression, seed 262, number 2178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b3435 \in {-1, 2} : (~TRUE)} \subseteq {(-1) : b3436 \in {b3437 \in 1..3 : TRUE}}) \/ (((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = (CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE)) /\ (({x \in 1..3 : x > 1} \ [x \in Nat |-> x + 1]) \subseteq {3, (1 :> 2)}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
