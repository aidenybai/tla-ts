(*---
description: Evaluates a random set expression, seed 262, number 1084.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01084 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((LET b1728 == (TRUE <=> [x \in 1..2 |-> x]) IN Head([a |-> 1, b |-> TRUE]) .. (-(CHOOSE b1729 \in {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
