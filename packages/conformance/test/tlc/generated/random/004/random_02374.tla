(*---
description: Evaluates a random record expression, seed 262, number 2374.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02374 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(<<7, -1>>) < (-Cardinality(Nat))) \/ (~(\E b3760 \in UNION {Nat, {1, 2}} : [[a |-> 1] EXCEPT !.a = @ + [a |-> 1, b |-> TRUE]]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
