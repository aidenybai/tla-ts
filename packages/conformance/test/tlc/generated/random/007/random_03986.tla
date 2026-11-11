(*---
description: Evaluates a random int expression, seed 262, number 3986.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03986 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({b6275 \in {([a |-> 1, b |-> TRUE]).a, (1 - 3)} : ({b6276 \in {1, 2} : TRUE} = ({x \in 1..3 : x > 1} \cup 2..1))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
