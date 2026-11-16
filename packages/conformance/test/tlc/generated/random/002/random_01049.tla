(*---
description: Evaluates a random set expression, seed 262, number 1049.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01049 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {Head(<<{1, 7}, ((1 :> 2))[2147483647]>>), [Tail(<<2, 1>>) EXCEPT !.a = @ + (Cardinality({2, 1, 3}) % (0 * 2147483647))]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01049 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
