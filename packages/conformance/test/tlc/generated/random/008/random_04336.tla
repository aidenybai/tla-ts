(*---
description: Evaluates a random bool expression, seed 262, number 4336.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04336 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a = CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> {b6829 : b6829 \in Nat} [] OTHER -> Head(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04336 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
