(*---
description: Evaluates a random seq expression, seed 262, number 5364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<LET b8296 == ((1 :> 2))[-1] IN ([a |-> 1]).a, CASE (TRUE <=> TRUE) -> Len(<<1, 2>>) [] OTHER -> LET b8297 == -1 IN [x \in Nat |-> x + 1]>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
