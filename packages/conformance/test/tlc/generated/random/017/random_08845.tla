(*---
description: Evaluates a random seq expression, seed 262, number 8845.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08845 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(Append(SortSeq(<<1>>, LAMBDA p, q : p < q), (3 - 1)), [b13692 \in {b13693 \in 1..3 : FALSE} |-> ([a |-> 1, b |-> TRUE]).a], ([b13694 \in {1, 2} |-> 2147483647])[IF TRUE THEN 1 ELSE 7]), (CHOOSE r \in [a : 2..1] : TRUE), (([(1 :> 2) EXCEPT ![7] = 1])[(3 * 2)] - (-IF TRUE THEN 2 ELSE 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08845 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<>>
---*)
