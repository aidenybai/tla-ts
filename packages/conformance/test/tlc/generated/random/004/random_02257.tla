(*---
description: Evaluates a random int expression, seed 262, number 2257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({Cardinality({b3557 \in {} : FALSE}) : b3556 \in DOMAIN [[x \in 1..2 |-> x] EXCEPT ![1] = 0]}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
