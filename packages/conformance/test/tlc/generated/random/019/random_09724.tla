(*---
description: Evaluates a random record expression, seed 262, number 9724.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09724 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append(Append(Append(<<1, 2>>, 3), (2147483647 % 0)), ([b15090 \in SUBSET {1} |-> 1])[(7 * 7)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09724 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
