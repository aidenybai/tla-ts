(*---
description: Evaluates a random function expression, seed 262, number 3092.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03092 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([(1 :> TRUE) EXCEPT ![Cardinality({2, 1, 3})] = Len(<<>>)] @@ [b4929 \in {b4930 \in {2, 1, 3} : FALSE} |-> (b4929 + b4929)]) EXCEPT ![((-Len(<<3, 1, 2>>)) % ((2 - 1) \div ((1 :> 2))[0]))] = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = Len(<<1>>)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 28 of module random_03092
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03092 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
