(*---
description: Evaluates a random function expression, seed 262, number 30.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00030 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b48 == CASE ({} = SUBSET {1}) -> Cardinality({}) [] OTHER -> (-0) IN Head(SelectSeq(<<>>, LAMBDA e : e > 0)) :> (CASE ({} \subseteq 2..1) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> Head(<<>>) * (-Cardinality({1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00030 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
