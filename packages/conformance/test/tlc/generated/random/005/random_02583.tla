(*---
description: Evaluates a random bool expression, seed 262, number 2583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SortSeq(<<2147483647, -1>>, LAMBDA p, q : p < q) EXCEPT ![1] = ([[a |-> 1] EXCEPT !.a = @ + 0]).a] /\ ({(2147483647 - 3), (0 - 1)} \subseteq {b4068 \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] : (b4068 \in {2, 1, 3})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02583 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a tuple.
    line 14, col 17 to line 14, col 234 of module random_02583
---*)
