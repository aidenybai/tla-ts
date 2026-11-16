(*---
description: Evaluates a random int expression, seed 262, number 2252.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02252 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({Tail(Tail(<<3, 1, 2>>)) : b3547 \in {(7 % b3548) : b3548 \in {b3549 \in {1, 2} : FALSE}}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
