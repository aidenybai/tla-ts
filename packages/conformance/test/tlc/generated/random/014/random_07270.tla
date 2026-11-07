(*---
description: Evaluates a random record expression, seed 262, number 7270.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07270 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Head(<<>>), b |-> (TRUE /\ TRUE)] EXCEPT !.a = Cardinality((1..3 \ <<3, 1, 2>>))] EXCEPT !.a = @ + ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = (-1 + -1)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
