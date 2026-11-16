(*---
description: Evaluates a random seq expression, seed 262, number 3994.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03994 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([<<(3 - 3), (-3)>> EXCEPT ![1] = CASE (~FALSE) -> Head(<<1, 2>>) [] OTHER -> (0 \div 2147483647)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-3>>"
---*)
