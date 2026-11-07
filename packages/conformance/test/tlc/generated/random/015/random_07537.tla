(*---
description: Evaluates a random seq expression, seed 262, number 7537.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07537 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(SubSeq(Tail(TRUE), DOMAIN [x \in 1..2 |-> x], (0 - 0)), LAMBDA p, q : p < q) EXCEPT ![1] = Cardinality(((2147483647 + 2) .. (7 + 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
---*)
