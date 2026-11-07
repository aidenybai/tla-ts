(*---
description: Evaluates a random bool expression, seed 262, number 8608.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08608 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b13332 \in ((0 - 0) .. IF TRUE THEN 3 ELSE FALSE) : (\E b13333 \in {b13334 \in 2..1 : FALSE} : (~TRUE))} \subseteq {(-Len([a |-> 1])), ((2 \div 0) + Len(<<>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
---*)
