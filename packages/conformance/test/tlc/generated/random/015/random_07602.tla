(*---
description: Evaluates a random seq expression, seed 262, number 7602.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07602 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SortSeq([[a |-> 1, b |-> TRUE] EXCEPT ![1] = 3], LAMBDA p, q : p < q)), {(Head(<<1, 2>>) * CASE FALSE -> 1 [] OTHER -> 2147483647), ((-[a |-> 1, b |-> TRUE]) * (7 * 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07602 failed.
    Attempted to access record by a non-string argument: 1
---*)
