(*---
description: Evaluates a random seq expression, seed 262, number 9301.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09301 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SubSeq(SubSeq(<<>>, 7, 0), ([x \in Nat |-> x + 1])[-1], (-0))), ((([a |-> 1, b |-> TRUE] + -1) * (3 \div 2)) - ((0 < 1) - (0 * 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09301 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 71 to line 14, col 75 of module random_09301>],
    the first argument is:
    -1
    which is not in its domain.
---*)
