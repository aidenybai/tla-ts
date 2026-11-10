(*---
description: Evaluates a random bool expression, seed 262, number 7800.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07800 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b12027 == 3 IN -1 \in (Nat \cap {2, 1, 3})) <=> (\A b12028 \in {b12029 \in 1..3 : FALSE} : (~TRUE))) => ((({} \ (1 :> 2)) \ {2 : b12030 \in {1}}) \subseteq (UNION {Nat, SUBSET {1}} \cap {b12031 : b12031 \in <<5, 6>>}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
