(*---
description: Evaluates a random int expression, seed 262, number 4658.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04658 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((Cardinality((2..1 \cup {})) .. IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN (-1) ELSE (-1 + 2147483647))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2147483647"
---*)
