(*---
description: Evaluates a random seq expression, seed 262, number 816.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00816 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b1336 \in Tail(<<>>) : (TRUE \/ TRUE)}, {Cardinality({2, 1, 3}), Head(<<>>)}} \subseteq (UNION {{2147483647 : b1337 \in {1, 2}}, UNION {2..1, {}}} \cup {b1338 \in {0, 3} : (FALSE /\ TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
