(*---
description: Evaluates a random set expression, seed 262, number 4650.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04650 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head([{x \in 1..3 : x > 1} EXCEPT ![1] = 1]) - LET b7276 == Len([a |-> 1]) IN (b7276 \div b7276)) .. Head(SortSeq(Append(<<1, 2>>, 3), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04650 failed.
    Attempted to apply EXCEPT construct to the value {2, 3}.
---*)
