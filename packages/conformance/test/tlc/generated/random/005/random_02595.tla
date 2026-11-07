(*---
description: Evaluates a random seq expression, seed 262, number 2595.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02595 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SubSeq(Tail(<<>>), Head(<<1, 2>>), (2147483647 \div <<5, 6>>)) EXCEPT ![1] = (CHOOSE b4092 \in ({} \cup 1..3) : ([a |-> 1] = [a |-> 1, b |-> TRUE]))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
