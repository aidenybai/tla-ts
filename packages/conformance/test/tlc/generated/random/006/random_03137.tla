(*---
description: Evaluates a random set expression, seed 262, number 3137.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03137 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(Tail(SubSeq(<<3, 1, 2>>, 2147483647, 1))), Len(([<<3, 1, 2>> EXCEPT ![1] = 0] \o Append(<<1, 2>>, 1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
