(*---
description: Evaluates a random set expression, seed 262, number 2979.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02979 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[a |-> b4731, b |-> FALSE] EXCEPT !.a = @ + LET b4732 == b4731 IN 7]).a : b4731 \in {Head(Tail(<<1, 2>>)), LET b4733 == UNION {SUBSET {1}, SUBSET {1}} IN CASE FALSE -> b4733 [] OTHER -> 2}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {9}"
---*)
