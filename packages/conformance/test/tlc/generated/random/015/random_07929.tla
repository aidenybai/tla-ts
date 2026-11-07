(*---
description: Evaluates a random seq expression, seed 262, number 7929.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07929 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append((LET b12242 == 0 IN 2147483647 :> (2147483647 \div 1)), Head(SortSeq({x \in 1..3 : x > 1}, LAMBDA p, q : p < q))), LET b12243 == DOMAIN [<<5, 6>> EXCEPT ![TRUE] = 0] IN (CHOOSE b12244 \in DOMAIN [a |-> 1] : ([a |-> 1] = [a |-> 1, b |-> TRUE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {2, 3}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {2, 3}
---*)
