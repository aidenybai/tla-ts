(*---
description: Evaluates a random seq expression, seed 262, number 7636.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07636 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((Append(Tail(<<1>>), ([x \in Nat |-> x + 1])[-1]) \o (Append([a |-> 1, b |-> TRUE], 2147483647) \o <<2147483647, 7>>)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07636 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 61 to line 14, col 65 of module random_07636>],
    the first argument is:
    -1
    which is not in its domain.
---*)
