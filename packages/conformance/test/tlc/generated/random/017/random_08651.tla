(*---
description: Evaluates a random function expression, seed 262, number 8651.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08651 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail((<<>> \o <<1>>))) :> Cardinality((UNION {{1, 2}, 2..1} \ {2, 2147483647}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08651 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
