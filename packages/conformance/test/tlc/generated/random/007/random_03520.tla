(*---
description: Evaluates a random int expression, seed 262, number 3520.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03520 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2}] : TRUE) * (([b5561 \in Nat |-> b5561])[Head(<<>>)] % Cardinality((-1 .. 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03520 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
