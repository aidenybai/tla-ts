(*---
description: Evaluates a random seq expression, seed 262, number 6020.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06020 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<IF ({b9275 : b9275 \in {2, 1, 3}} \subseteq {2 : b9276 \in 1..3}) THEN ((2 - 2) + Cardinality({x \in 1..3 : x > 1})) ELSE (Len(<<>>) + Len(<<>>)), (Len([a |-> 3, b |-> FALSE]) \div (-(1 + TRUE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06020 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 3, b |-> FALSE]
---*)
