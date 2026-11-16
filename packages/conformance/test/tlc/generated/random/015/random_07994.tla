(*---
description: Evaluates a random seq expression, seed 262, number 7994.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07994 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([Head(<<1>>) EXCEPT ![CASE TRUE -> 0 [] OTHER -> 3] = (CHOOSE b12342 \in [x \in 1..2 |-> x] : TRUE)])[IF (FALSE \/ FALSE) THEN (0 % 0) ELSE (-0)], Len(Tail(SelectSeq(<<1>>, LAMBDA e : e > 0)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07994 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
