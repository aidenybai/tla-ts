(*---
description: Evaluates a random int expression, seed 262, number 3569.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03569 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<(-Len(<<3, 1, 2>>)), ({2147483647 : b5636 \in 1} = ([a |-> 1, b |-> TRUE] \cap {x \in 1..3 : x > 1}))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03569 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    1
---*)
