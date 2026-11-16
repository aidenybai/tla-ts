(*---
description: Evaluates a random int expression, seed 262, number 3820.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03820 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append([([x \in 1..2 |-> x] \o <<1, 2>>) EXCEPT ![1] = Cardinality(Nat)], ((0 - [a |-> 1, b |-> TRUE]) * (<<1>> /\ FALSE))), (Head(Tail(<<1>>)) = ((-1 * 1) \div (7 * 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03820 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
