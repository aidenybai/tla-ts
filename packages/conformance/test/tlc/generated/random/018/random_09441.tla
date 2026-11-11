(*---
description: Evaluates a random int expression, seed 262, number 9441.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09441 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({(-(<<3, 1, 2>> = (1 :> 2))) : b14652 \in ({b14653 \in {1} : FALSE} \cup (2 .. 1))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
