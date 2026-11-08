(*---
description: Evaluates a random record expression, seed 262, number 9407.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09407 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-(Head(<<>>) \div (2 = <<>>))), b |-> (\E b14592 \in (DOMAIN [x \in 1..2 |-> x] \cup (Nat \cup <<5, 6>>)) : (\A b14593 \in {{2, 1, 3}, 7} : (TRUE /\ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09407 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
