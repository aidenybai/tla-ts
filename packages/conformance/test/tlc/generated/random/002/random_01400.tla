(*---
description: Evaluates a random seq expression, seed 262, number 1400.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01400 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) EXCEPT ![1] = (IF {1, 2} THEN -1 ELSE 2147483647 % (CHOOSE b2232 \in {x \in 1..3 : x > 1} : TRUE))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01400 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as the condition of an IF.
    line 14, col 85 to line 14, col 166 of module random_01400
---*)
