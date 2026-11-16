(*---
description: Evaluates a random seq expression, seed 262, number 4859.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04859 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(((Append(<<1>>, -1) \o [<<1>> EXCEPT ![1] = 0]) \o [Tail(<<>>) EXCEPT ![1] = ([x \in 1..2 |-> x])[3]]), IF ((FALSE /\ FALSE) <=> ([a |-> 1] = FALSE)) THEN ((3 - 3) \div Head(<<3, 1, 2>>)) ELSE IF (~TRUE) THEN (3 * 1) ELSE Len(<<1>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04859 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
