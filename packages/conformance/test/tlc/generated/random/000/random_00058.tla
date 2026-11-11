(*---
description: Evaluates a random int expression, seed 262, number 58.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b83 == (([a |-> 1]).a * (2147483647 - 2)) IN Len((<<1, 2>> \o <<1>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
