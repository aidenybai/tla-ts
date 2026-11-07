(*---
description: Evaluates a random seq expression, seed 262, number 8707.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08707 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SubSeq(Tail(<<>>), (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE), (-0)) EXCEPT ![1] = ((<<5, 6>>)[3] - [<<>> EXCEPT ![1] = 7])] EXCEPT ![1] = Head([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = (2 % 2)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
