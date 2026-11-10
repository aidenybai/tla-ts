(*---
description: Evaluates a random bool expression, seed 262, number 1343.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01343 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), ((1 % 0) + (7 - -1))) = [[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = Cardinality(1..3)] EXCEPT !.a = @ + (CHOOSE b2146 \in (CHOOSE r \in [a : {0} \cup {1}] : TRUE) : Tail(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01343 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
