(*---
description: Evaluates a random seq expression, seed 262, number 4271.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04271 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SelectSeq([<<1>> EXCEPT ![1] = [a |-> 1, b |-> TRUE]], LAMBDA e : e > 0), LAMBDA p, q : p < q) EXCEPT ![1] = Cardinality({(7 - 2147483647), LET b6726 == -1 IN 3})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    [a |-> 1, b |-> TRUE]
    2266:0 The first argument of > should be an integer, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
