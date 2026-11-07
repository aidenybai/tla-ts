(*---
description: Evaluates a random int expression, seed 262, number 4703.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04703 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Head((<<3, 1, 2>> \o <<3, 1, 2>>))) - Len(SubSeq(Tail([a |-> 1, b |-> TRUE]), (<<1>>)[2147483647], Head(1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 1, b |-> TRUE]
---*)
