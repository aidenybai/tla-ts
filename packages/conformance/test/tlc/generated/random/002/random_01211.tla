(*---
description: Evaluates a random int expression, seed 262, number 1211.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(([<<1, 2>> EXCEPT ![1] = 3] \o Tail(<<>>))) \div ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
