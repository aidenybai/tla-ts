(*---
description: Evaluates a random int expression, seed 262, number 5056.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05056 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-CASE (1 \in 2..1) -> ([a |-> 1]).a [] OTHER -> (-1 \div 7)) - Head(Tail(Tail(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05056 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
