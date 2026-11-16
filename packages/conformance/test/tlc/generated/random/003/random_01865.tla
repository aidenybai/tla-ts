(*---
description: Evaluates a random seq expression, seed 262, number 1865.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01865 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(-LET b2941 == Len(<<>>) IN (CHOOSE b2942 \in {2, 1, 3} : TRUE)), Len(<<[b2943 \in 2..1 |-> b2943], (-1 * 7)>>)>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-1, 2>>"
---*)
