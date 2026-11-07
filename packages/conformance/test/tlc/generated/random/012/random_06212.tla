(*---
description: Evaluates a random seq expression, seed 262, number 6212.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06212 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([Tail(Tail(<<>>)) EXCEPT ![1] = (Len(<<3, 1, 2>>) % Len([a |-> 1, b |-> TRUE]))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
