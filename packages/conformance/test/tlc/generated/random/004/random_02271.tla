(*---
description: Evaluates a random set expression, seed 262, number 2271.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02271 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([a |-> (FALSE)[b3583], b |-> (b3583 \in {2, 1, 3})]).a : b3583 \in [[b3584 \in ({2, 1, 3} \ {1}) |-> CASE TRUE -> {2, 1, 3} [] OTHER -> 7] EXCEPT ![Head(SelectSeq(<<>>, LAMBDA e : e > 0))] = (Head(<<3, 1, 2>>) + Len(<<1, 2>>))]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02271 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
