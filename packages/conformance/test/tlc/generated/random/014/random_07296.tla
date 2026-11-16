(*---
description: Evaluates a random int expression, seed 262, number 7296.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07296 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Len((Tail(<<1, 2>>) \o <<7, 3>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
