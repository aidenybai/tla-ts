(*---
description: Evaluates a random bool expression, seed 262, number 1739.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01739 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(([a |-> 1, b |-> TRUE]).a + (-1 % b2760)) : b2760 \in (UNION {{1, 2}, {}} \cup UNION {Nat, SUBSET {1}})} \subseteq {((CHOOSE b2761 \in {} : TRUE) \div ([x \in Nat |-> x + 1])[2]), Cardinality(({1} \ 1..3))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01739 failed.
    Attempted to compare the set {{}, {1}} with the value:
    Nat
---*)
