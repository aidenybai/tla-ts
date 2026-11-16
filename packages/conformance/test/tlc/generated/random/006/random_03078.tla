(*---
description: Evaluates a random bool expression, seed 262, number 3078.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03078 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b4892 == 0 IN 2147483647 = IF TRUE THEN 1 ELSE 7) /\ (Cardinality(Nat) < (1 % 2))) /\ ([a |-> ([a |-> 1] % 7), b |-> (Nat \subseteq {x \in 1..3 : x > 1})] = [a |-> LET b4893 == 2147483647 IN b4893, b |-> (3 = -1)])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
