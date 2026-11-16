(*---
description: Evaluates a random int expression, seed 262, number 3869.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03869 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> Head(Append(<<1, 2>>, 3)), b |-> ((FALSE \/ TRUE) \/ (~TRUE))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
