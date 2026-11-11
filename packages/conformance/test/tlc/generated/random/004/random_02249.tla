(*---
description: Evaluates a random int expression, seed 262, number 2249.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02249 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Append(Append(Tail(<<>>), [[x \in 1..2 |-> x] EXCEPT ![-1] = 3]), ((-1 - 0) % Cardinality({})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02249 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
