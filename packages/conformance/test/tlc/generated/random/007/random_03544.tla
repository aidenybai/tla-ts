(*---
description: Evaluates a random record expression, seed 262, number 3544.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03544 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Len(<<>>), b |-> (TRUE => FALSE)] EXCEPT !.a = @ + Len(SortSeq(<<>>, LAMBDA p, q : p < q))] EXCEPT !.a = ([a |-> Head(<<>>), b |-> (1 = 7)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
