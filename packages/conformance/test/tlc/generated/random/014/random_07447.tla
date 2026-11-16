(*---
description: Evaluates a random int expression, seed 262, number 7447.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07447 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<CASE (0 < -1) -> (2 % [a |-> 1]) [] OTHER -> (-1 - 3), LET b11481 == Len(<<3, 1, 2>>) IN (b11481 * b11481)>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
