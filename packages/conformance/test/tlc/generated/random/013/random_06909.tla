(*---
description: Evaluates a random int expression, seed 262, number 6909.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06909 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Tail((<<1, 0>> \o (<<1, 2>> \o <<>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
