(*---
description: Evaluates a random int expression, seed 262, number 8379.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08379 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (<<([a |-> 1, b |-> TRUE]).a, ((1 :> 2))[1]>> = ((0 + 1) :> Head(<<1, 2>>))) -> (-Len((<<1, 2>> \o <<1, 2>>))) [] OTHER -> Head([SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (0 - 2)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)
