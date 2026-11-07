(*---
description: Evaluates a random seq expression, seed 262, number 1189.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01189 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq((Tail(<<>>) \o <<1, [a |-> 1]>>), LAMBDA e : e > 0) EXCEPT ![1] = ([[b1905 \in SUBSET {1} |-> 3] EXCEPT ![IF FALSE THEN 2147483647 ELSE 2147483647] = Cardinality({1})])[((7 - 1) * (2147483647 % 2147483647))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
