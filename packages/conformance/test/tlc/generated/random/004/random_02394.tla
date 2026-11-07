(*---
description: Evaluates a random seq expression, seed 262, number 2394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(SubSeq(Tail(-1), Head(<<1, 2>>), (0 % 1))), ((Len(<<1>>) + [[a |-> 1] EXCEPT !.a = 3]) \div (Head(<<1, 2>>) :> (2147483647 \div 7)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    -1
    2283:0 The argument of Tail should be a sequence, but instead it is:
    -1
---*)
