(*---
description: Evaluates a random seq expression, seed 262, number 1349.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01349 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((<<([a |-> 1, b |-> TRUE]).a, Len(<<>>)>> \o <<(3 - 7), LET b2152 == 2 IN b2152>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, -4, 2>>"
---*)
