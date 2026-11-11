(*---
description: Evaluates a random seq expression, seed 262, number 279.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00279 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SubSeq(Tail(<<>>), (-1 + [a |-> 1]), (-1 \div 7)) EXCEPT ![1] = IF (FALSE => TRUE) THEN Cardinality({1, 2}) ELSE LET b473 == 1 IN 0], ((([a |-> 1, b |-> TRUE]).a + Cardinality(Nat)) \div Len(<<-1, 1>>)), ((({2, 1, 3})[2] - (2147483647 \div 1)) + IF (-1 = 2147483647) THEN IF TRUE THEN 2 ELSE -1 ELSE IF 7 THEN 1 ELSE 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00279 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
