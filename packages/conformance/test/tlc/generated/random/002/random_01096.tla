(*---
description: Evaluates a random bool expression, seed 262, number 1096.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01096 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 .. 0) = UNION {Nat, 1..3}) \/ (<<-1, 2>> = [[x \in Nat |-> x + 1] EXCEPT ![2] = 2147483647])) <=> (DOMAIN (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE) \subseteq ({b1746 \in {} : FALSE} \cap ({1, 2} \cap 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01096 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    Nat
---*)
