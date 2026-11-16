(*---
description: Evaluates a random int expression, seed 262, number 4252.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04252 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append(Append(Tail(<<1, 2>>), ({} \cap Nat)), ((0 \div 2) * Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
