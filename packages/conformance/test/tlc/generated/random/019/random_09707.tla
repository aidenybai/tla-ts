(*---
description: Evaluates a random seq expression, seed 262, number 9707.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09707 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((CHOOSE r \in [a : {1, 2}] : TRUE)).a, (Len(Tail(<<>>)) + Head([<<>> EXCEPT ![1] = 2147483647]))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
