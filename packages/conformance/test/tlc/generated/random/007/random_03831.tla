(*---
description: Evaluates a random int expression, seed 262, number 3831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(<<(-1 + 7), CASE FALSE -> 1 [] OTHER -> 2147483647>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
