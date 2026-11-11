(*---
description: Evaluates a random int expression, seed 262, number 418.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00418 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(({x \in 1..3 : x > 1}).a, LAMBDA e : e > 0)) - (-([b682 \in [a |-> 1] |-> b682])[(3 - 0)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00418 failed.
    Attempted to select field "a" from a non-record value {2, 3}
    line 14, col 31 to line 14, col 54 of module random_00418
---*)
