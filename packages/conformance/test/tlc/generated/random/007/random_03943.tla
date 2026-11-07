(*---
description: Evaluates a random set expression, seed 262, number 3943.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03943 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Len((<<2147483647, 2>> \o Append(<<1, 2>>, -1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -5"
---*)
