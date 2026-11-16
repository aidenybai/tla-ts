(*---
description: Evaluates a random set expression, seed 262, number 9731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(<<Len(<<1, 2>>), (0 * 1)>>) : b15103 \in (((1 .. 2147483647) \cup {b15104 : b15104 \in {1}}) \ (UNION {{2, 1, 3}, {2, 1, 3}} \cup {-1 : b15105 \in 2..1}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09731 failed.
    Attempted to construct a set with too many elements (>1000000).
---*)
