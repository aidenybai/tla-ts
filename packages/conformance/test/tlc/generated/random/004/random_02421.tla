(*---
description: Evaluates a random int expression, seed 262, number 2421.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02421 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (([a |-> -1, b |-> TRUE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]) \/ ((FALSE <=> FALSE) <=> (<<1>> = [x \in Nat |-> x + 1]))) THEN IF ((\A b3823 \in [a |-> 1] : [a |-> 1]) /\ (-1 = 2)) THEN (CHOOSE b3824 \in (-1 \div 0) : (~FALSE)) ELSE Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) ELSE (((3 - 1) - IF TRUE THEN 3 ELSE 1) + ((-2147483647) \div Len(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02421 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
