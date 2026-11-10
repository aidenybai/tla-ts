(*---
description: Evaluates a random bool expression, seed 262, number 4561.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04561 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b7154 \in {IF (FALSE \/ FALSE) THEN (2 = 1) ELSE (2147483647 \in {2, 1, 3}), (({x \in 1..3 : x > 1} \subseteq {2, 1, 3}) \/ (1..3 \subseteq Nat))} : ((({2, 1, 3} = SUBSET {1}) <=> ({1} \subseteq {2, 1, 3})) /\ (~({1} \subseteq {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
