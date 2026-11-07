(*---
description: Evaluates a random int expression, seed 262, number 1805.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01805 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality(SUBSET {1}) \div (CHOOSE b2857 \in 1..3 : [a |-> 1, b |-> TRUE])) - ([b2858 \in 1..3 |-> -1])[Cardinality({2, 1, 3})]) % Len(Tail(SubSeq(<<>>, {2, 1, 3}, 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 49 to line 14, col 93 of module random_01805
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 49 to line 14, col 93 of module random_01805
---*)
