(*---
description: Evaluates a random bool expression, seed 262, number 1045.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01045 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(((<<>> \o <<1>>) \o Tail(<<>>))) = [(([x \in Nat |-> x + 1])[2147483647] :> (-1 + 7)) EXCEPT ![(-(1 - 2147483647))] = LET b1678 == (2 \div 2147483647) IN Head(<<>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01045 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
