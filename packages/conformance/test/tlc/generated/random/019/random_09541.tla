(*---
description: Evaluates a random bool expression, seed 262, number 9541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(Tail(<<1>>), LAMBDA e : e > 0)) = (-Len([b14827 \in [a |-> 1] |-> b14827]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09541 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
