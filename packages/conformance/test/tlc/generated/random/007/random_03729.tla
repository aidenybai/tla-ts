(*---
description: Evaluates a random int expression, seed 262, number 3729.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03729 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({(LET b5888 == 7 IN b5888 \div ([a |-> 1]).a) : b5887 \in (UNION {3, {}} \cup {b5889 : b5889 \in {2, 1, 3}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03729 failed.
    Attempted to compare the set {} with the value:
    3
---*)
