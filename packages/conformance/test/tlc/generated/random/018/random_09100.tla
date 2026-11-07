(*---
description: Evaluates a random int expression, seed 262, number 9100.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09100 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ((1 % 7) * (-1)), b |-> (UNION {SUBSET {1}, {}} = {b14136 \in 1 : TRUE})]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09100 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    1
    is not enumerable
---*)
