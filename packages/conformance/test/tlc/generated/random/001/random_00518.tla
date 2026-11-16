(*---
description: Evaluates a random record expression, seed 262, number 518.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00518 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (([[x \in 1..2 |-> x] EXCEPT ![3] = 1])[Head(<<1, 2>>)] \div Cardinality(DOMAIN <<5, 6>>)), b |-> (Tail(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) = (CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 43 of module random_00518
    | [a |-> 0, b |-> FALSE]
---*)
