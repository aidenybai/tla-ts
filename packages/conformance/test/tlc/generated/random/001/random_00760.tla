(*---
description: Evaluates a random record expression, seed 262, number 760.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00760 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> {Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), Cardinality({2, 1})}, b |-> ((CHOOSE b1245 \in UNION {{1}, -1} : ([a |-> 1, b |-> TRUE] = [a |-> 1])) \in {Len(<<1, 2>>), (CHOOSE b1246 \in {1, 2} : FALSE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00760 failed.
    Attempted to compare integer -1 with non-integer:
    {1}
---*)
