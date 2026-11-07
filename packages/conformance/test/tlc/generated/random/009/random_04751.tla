(*---
description: Evaluates a random bool expression, seed 262, number 4751.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04751 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b7415 \in Head(Tail(Tail(<<>>))) : (((<<1>> \o <<>>) = (CHOOSE f \in [{1} -> {1, 2}] : TRUE)) /\ (([a |-> 1] = [a |-> 1]) \/ (TRUE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
