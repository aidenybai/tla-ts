(*---
description: Evaluates a random seq expression, seed 262, number 6961.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06961 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Append((<<>> \o <<3, 1, 2>>), ([x \in 1..2 |-> x])[2]), LAMBDA e : e > 0) EXCEPT ![1] = LET b10651 == Head(<<0, 2>>) IN ((b10651 :> 0))[(b10651 * b10651)]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 1, 2, 2>>"
---*)
