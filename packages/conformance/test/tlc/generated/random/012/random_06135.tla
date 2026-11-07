(*---
description: Evaluates a random function expression, seed 262, number 6135.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06135 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9431 \in {Head(<<FALSE, 0>>), Cardinality((Nat \cup 2..1))} |-> (-Len(Tail(<<1, 2>>)))])
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
