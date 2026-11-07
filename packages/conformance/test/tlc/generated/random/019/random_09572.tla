(*---
description: Evaluates a random bool expression, seed 262, number 9572.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09572 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14861 \in {Head(SubSeq(<<1>>, 2147483647, 1)), ([[x \in Nat |-> x + 1] EXCEPT ![0] = 7])[(<<5, 6>>)[2]]} : ((([x \in 1..2 |-> x])[b14861] .. (b14861 \div 3)) = UNION {Len(<<1, 2>>), {b14862 \in {1} : FALSE}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
