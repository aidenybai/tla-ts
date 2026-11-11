(*---
description: Evaluates a random function expression, seed 262, number 7170.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07170 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11016 \in {Head(SubSeq(<<3, 1, 2>>, [a |-> 1, b |-> TRUE], <<5, 6>>)) : b11017 \in ({2, 0} \cap (Nat \cup {1}))} : ((Len(<<1>>) - Len(<<3, 1, 2>>)) < (IF TRUE THEN b11016 ELSE b11016 % (0 \div 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07170 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
