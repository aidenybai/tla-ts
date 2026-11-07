(*---
description: Evaluates a random bool expression, seed 262, number 6425.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06425 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({7, 0} \subseteq (2 % 0)) => Head(<<1, -1>>)) => (\A b9889 \in ({3 : b9890 \in {2, 1, 3}} \cup {-1, 7}) : ((\E b9891 \in {1} : FALSE) \/ (Nat \subseteq Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
