(*---
description: Evaluates a random int expression, seed 262, number 1279.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01279 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(Append(<<1, 2>>, 2147483647))) - Len(<<CASE FALSE -> -1 [] OTHER -> 3, CASE TRUE -> 2147483647 [] OTHER -> 2147483647>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
