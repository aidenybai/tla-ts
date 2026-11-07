(*---
description: Evaluates a random record expression, seed 262, number 6480.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06480 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) + Len(([a |-> 1] = [a |-> 1]))), b |-> (Cardinality({2, -1}) = CASE ({1} = {1, 2}) -> (3 * 1) [] OTHER -> Len(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
