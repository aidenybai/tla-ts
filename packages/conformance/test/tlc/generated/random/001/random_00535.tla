(*---
description: Evaluates a random record expression, seed 262, number 535.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00535 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(Append([<<1, 2>> EXCEPT ![1] = -1], (-1))), b |-> ((\A b902 \in {b903 \in {1} : TRUE} : (\A b904 \in {x \in 1..3 : x > 1} : TRUE)) <=> ((~FALSE) \/ (FALSE = <<5, 6>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -1, b |-> TRUE]"
---*)
