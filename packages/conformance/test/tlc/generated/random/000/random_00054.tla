(*---
description: Evaluates a random record expression, seed 262, number 54.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00054 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (FALSE = 1..3) THEN Head(<<1, 2>>) ELSE (2147483647 % 7), b |-> (<<7, 3>> \in {b80 : b80 \in {2, 1, 3}})] EXCEPT !.a = Len(Append([<<3, 1, 2>> EXCEPT ![1] = 2], LET b81 == 0 IN b81))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00054 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    1..3
---*)
