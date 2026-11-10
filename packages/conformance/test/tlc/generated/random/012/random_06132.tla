(*---
description: Evaluates a random bool expression, seed 262, number 6132.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06132 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(<<(<<5, 6>>)[-1], (2..1 * 2147483647)>>, (Head(<<1>>) + IF [a |-> 1, b |-> TRUE] THEN 7 ELSE 3), Head([0 EXCEPT ![1] = 7])) = (CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06132 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
