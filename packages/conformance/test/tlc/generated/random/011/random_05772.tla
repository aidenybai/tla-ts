(*---
description: Evaluates a random seq expression, seed 262, number 5772.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05772 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq([<<[a |-> 1, b |-> TRUE], -1>> EXCEPT ![1] = LET b8891 == 3 IN [a |-> 1, b |-> TRUE]], LAMBDA e : e > 0)))
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
