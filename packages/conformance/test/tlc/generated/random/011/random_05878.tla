(*---
description: Evaluates a random seq expression, seed 262, number 5878.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05878 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([Append(<<3, 1, 2>>, 3) EXCEPT ![1] = (0 - 7)], LAMBDA p, q : p < q) \o <<LET b9064 == (-3) IN LET b9065 == 2 IN b9064, ([a |-> 1, b |-> [a |-> 1, b |-> TRUE]]).a>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-7, 1, 2, 3, -3, 1>>"
---*)
