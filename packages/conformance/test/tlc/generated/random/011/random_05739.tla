(*---
description: Evaluates a random set expression, seed 262, number 5739.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05739 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(Cardinality({x \in 1..3 : x > 1}) \div (-2))) .. Head(SelectSeq(Tail(<<1>>), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05739 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
