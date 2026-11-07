(*---
description: Evaluates a random function expression, seed 262, number 4837.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04837 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((TRUE \/ FALSE) /\ (2147483647 \in {1, 2})) THEN Cardinality(DOMAIN [x \in Nat |-> x + 1]) ELSE (-Head(<<>>)) :> (-([[a |-> 1] EXCEPT !.a = 3]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
