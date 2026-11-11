(*---
description: Evaluates a random function expression, seed 262, number 5726.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05726 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8808 \in LET b8809 == Len((<<3, 1, 2>> \o <<1, 2>>)) IN Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) |-> (((FALSE \/ TRUE) \div Len(<<>>)) - (-LET b8810 == -1 IN b8810))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b8808 \\in 1 |-> <expression line 14, col 120 to line 14, col 181 of module random_05726>]"
---*)
