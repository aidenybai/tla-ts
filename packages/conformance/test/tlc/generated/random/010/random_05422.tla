(*---
description: Evaluates a random seq expression, seed 262, number 5422.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05422 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SortSeq((<<3, 1, 2>> \o <<1>>), LAMBDA p, q : p < q) \o (Tail(<<1, 2>>) \o Tail(<<1>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3, 2>>"
---*)
