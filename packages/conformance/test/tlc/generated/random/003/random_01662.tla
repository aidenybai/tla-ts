(*---
description: Evaluates a random function expression, seed 262, number 1662.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01662 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a :> Len([Append(<<1>>, 2) EXCEPT ![1] = ([a |-> 1, b |-> TRUE]).a])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
