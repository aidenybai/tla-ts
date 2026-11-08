(*---
description: Evaluates a random bool expression, seed 262, number 2785.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02785 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ((0 \div 0) \div Cardinality(2..1)), b |-> ((FALSE <=> FALSE) => (TRUE \/ TRUE))] \subseteq ((([a |-> 1]).a + (2 \div 7)) .. ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02785 failed.
    2179:0 The second argument of \div is 0.
---*)
