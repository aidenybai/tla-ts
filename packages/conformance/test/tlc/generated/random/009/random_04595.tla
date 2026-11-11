(*---
description: Evaluates a random seq expression, seed 262, number 4595.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04595 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(<<(2..1 \ {2, 1, 3}), Head(<<3, 1, 2>>)>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
