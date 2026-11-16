(*---
description: Evaluates a random function expression, seed 262, number 7162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b11008 == LET b11009 == LET b11010 == 7 IN b11010 IN IF FALSE THEN -1 ELSE -1 IN ([[x \in 1..2 |-> x] EXCEPT ![0] = 1])[Cardinality(Nat)] :> LET b11011 == Head((<<3, 1, 2>> \o <<>>)) IN (LET b11012 == b11011 IN -1 - Head(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 104 to line 14, col 121 of module random_07162
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07162 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
