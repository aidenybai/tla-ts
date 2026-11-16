(*---
description: Evaluates a random int expression, seed 262, number 7044.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07044 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({b10802 \in {([a |-> 1]).a, Head(<<3, 1, 2>>)} : (\E b10803 \in {b10804 \in Nat : FALSE} : (\A b10805 \in {1} : FALSE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07044 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
