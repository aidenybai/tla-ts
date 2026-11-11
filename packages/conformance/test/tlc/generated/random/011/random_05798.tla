(*---
description: Evaluates a random function expression, seed 262, number 5798.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05798 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [1..2 -> 1..2] : TRUE) @@ [b8940 \in {(0 \div b8941) : b8941 \in {b8942 \in 2..1 : TRUE}} |-> LET b8943 == Len(<<1>>) IN ({1, 2} - b8940)]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
