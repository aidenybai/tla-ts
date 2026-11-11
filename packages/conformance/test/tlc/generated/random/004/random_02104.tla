(*---
description: Evaluates a random int expression, seed 262, number 2104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b3342 == (-(-IF FALSE THEN 0 ELSE {1, 2})) IN Head([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = ([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
