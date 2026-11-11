(*---
description: Evaluates a random seq expression, seed 262, number 6531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), IF TRUE THEN 3 ELSE 2147483647, LET b10036 == FALSE IN 1..3), (-Cardinality({x \in 1..3 : x > 1})), ([[a |-> 1] EXCEPT !.a = @ + 3]).a) \o [(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT ![1] = (Cardinality({x \in 1..3 : x > 1}) + [(1 :> 2) EXCEPT ![3] = 0])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06531 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    1..3
---*)
