(*---
description: Evaluates a random bool expression, seed 262, number 8357.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08357 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 .. 2147483647) \cup DOMAIN [x \in Nat |-> x + 1]) \cup (Cardinality({1}) .. (2147483647 - 7))) = DOMAIN [[b12929 \in Nat |-> 7] EXCEPT ![Head(<<1, 2>>)] = Cardinality(SUBSET {1})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08357 failed.
    Size of interval value exceeds the maximum representable size (32bits): 0..2147483647.
---*)
