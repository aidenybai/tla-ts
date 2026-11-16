(*---
description: Evaluates a random seq expression, seed 262, number 4356.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04356 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), ([x \in Nat |-> x + 1])[0]) \o SubSeq(Tail(<<3, 1, 2>>), Head(<<1, 2>>), (1..3 % -1))) \o <<IF (\A b6863 \in {} : FALSE) THEN Cardinality(SUBSET {1}) ELSE (1 % 3), ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04356 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
