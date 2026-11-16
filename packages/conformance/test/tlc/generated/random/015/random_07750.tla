(*---
description: Evaluates a random bool expression, seed 262, number 7750.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07750 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b11953 == 3 IN b11953 + Len(<<3, 1, 2>>)) * Len(<<1, 1>>)) < Len(Tail((<<>> \o <<1>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
