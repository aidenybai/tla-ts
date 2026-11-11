(*---
description: Evaluates a random function expression, seed 262, number 1036.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(Append(SubSeq(<<3, 1, 2>>, 1, 2), (0 - 3)), Cardinality(({1, 2} \ SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01036 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
