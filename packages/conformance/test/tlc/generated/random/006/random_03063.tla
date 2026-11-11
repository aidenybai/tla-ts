(*---
description: Evaluates a random set expression, seed 262, number 3063.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03063 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN SelectSeq(Tail(Append(<<1, 2>>, 2147483647)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..2"
---*)
