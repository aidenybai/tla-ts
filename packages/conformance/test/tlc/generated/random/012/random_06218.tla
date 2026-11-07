(*---
description: Evaluates a random function expression, seed 262, number 6218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9569 \in (((-1 .. 0) \o Tail(<<>>)) \cup {b9570 \in {7, 0} : (~TRUE)}) |-> (CHOOSE b9571 \in {b9572 \in (Nat \cup {1}) : (2 .. 1)} : (~(\E b9573 \in SUBSET {1} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
