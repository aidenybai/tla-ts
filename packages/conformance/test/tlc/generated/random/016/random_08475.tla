(*---
description: Evaluates a random int expression, seed 262, number 8475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> LET b13115 == Cardinality({1}) IN Len(<<>>), b |-> (UNION {{}, 1..3} = ({2, 1, 3} \cap [a |-> 1]))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08475 failed.
    Attempted to check if element:
    2
    is in the record:
    [a |-> 1]
---*)
