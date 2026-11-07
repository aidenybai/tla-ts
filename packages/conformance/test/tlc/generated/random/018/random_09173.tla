(*---
description: Evaluates a random record expression, seed 262, number 9173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(SortSeq(<<>>, LAMBDA p, q : p < q)), b |-> (\E b14240 \in (3 .. 3) : (b14240 < 2147483647))] EXCEPT !.a = (-(CHOOSE b14241 \in (FALSE \cap {1}) : (7 \in {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
