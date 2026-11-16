(*---
description: Evaluates a random seq expression, seed 262, number 1141.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01141 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + LET b1830 == 1 IN b1830]).a, ([a |-> Len(<<1>>), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])]).a>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9, 1>>"
---*)
