(*---
description: Evaluates a random set expression, seed 262, number 6719.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06719 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(SelectSeq(<<3, 1>>, LAMBDA e : e > 0) = [(3 :> 1) EXCEPT ![Tail(<<>>)] = (-1)]), {([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a : b10299 \in {(7 % 0), (CHOOSE b10300 \in 1..3 : FALSE)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
