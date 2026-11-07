(*---
description: Evaluates a random set expression, seed 262, number 3863.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03863 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE r \in [a : {1, 2}] : TRUE)).a, LET b6089 == (([a |-> 1, b |-> TRUE]).a :> (7 .. <<>>)) IN Head(<<1, 0>>)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
