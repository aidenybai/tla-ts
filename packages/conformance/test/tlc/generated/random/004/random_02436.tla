(*---
description: Evaluates a random seq expression, seed 262, number 2436.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02436 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(Append(<<SUBSET {1}, [a |-> 1, b |-> TRUE]>>, (0 - -1)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    {{}, {1}}
    2266:0 The first argument of > should be an integer, but instead it is:
    {{}, {1}}
---*)
