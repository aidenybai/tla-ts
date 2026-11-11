(*---
description: Evaluates a random function expression, seed 262, number 1902.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01902 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((2 = -1) @@ [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]) EXCEPT ![Cardinality({b2983 \in 1..3 : [a |-> 1]})] = ((7 % 2) * (TRUE % -1))] @@ ((LET b2984 == -1 IN 1 \div Len(<<1, 2>>)) :> ((-1 % 2147483647) % (2 * 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01902 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
---*)
