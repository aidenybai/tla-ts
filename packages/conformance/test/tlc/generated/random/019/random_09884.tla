(*---
description: Evaluates a random set expression, seed 262, number 9884.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09884 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a]).a, Len(SelectSeq((<<1>> \o <<1>>), LAMBDA e : e > 0))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
