(*---
description: Evaluates a random int expression, seed 262, number 6554.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06554 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(({(0 - b10075) : b10075 \in ([a |-> 1] \cup Nat)} \ {Head(<<1, 2>>), (7 * 2147483647)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06554 failed.
    Attempted to enumerate S \cup T when S:
    [a |-> 1]
    and T:
    Nat
    are not both enumerable
---*)
