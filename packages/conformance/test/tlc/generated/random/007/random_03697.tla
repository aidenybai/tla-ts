(*---
description: Evaluates a random bool expression, seed 262, number 3697.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03697 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(<<3, -1>>, LAMBDA e : e > 0)) \in (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03697 failed.
    Attempted to check if element:
    3
    is in the record:
    [a |-> 2]
---*)
