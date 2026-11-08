(*---
description: Evaluates a random seq expression, seed 262, number 312.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00312 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(SortSeq(SubSeq(<<1, 2>>, 2147483647, 7), LAMBDA p, q : p < q), CASE (TRUE => FALSE) -> (1 \div 2) [] OTHER -> LET b520 == 3 IN b520, IF (\A b521 \in {} : [x \in Nat |-> x + 1]) THEN (-1 + 1) ELSE ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00312 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
