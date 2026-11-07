(*---
description: Evaluates a random bool expression, seed 262, number 7089.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07089 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (0 \div 3), b |-> ({1} \subseteq 1..3)] < (Head(<<>>) + CASE FALSE -> 7 [] OTHER -> 3)) => (((\E b10888 \in {2, 1, 3} : TRUE) /\ (0 % 0)) <=> ((-7) \in (1..3 \cup {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
