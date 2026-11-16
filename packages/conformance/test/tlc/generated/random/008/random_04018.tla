(*---
description: Evaluates a random seq expression, seed 262, number 4018.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04018 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b6312 == (LET b6313 == {x \in 1..3 : x > 1} IN b6313 * (7 + 0)) IN (CHOOSE b6314 \in {2 : b6315 \in {1}} : (\E b6316 \in {x \in 1..3 : x > 1} : TRUE)), ((CHOOSE r \in [a : {1}] : TRUE)).a>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1>>"
---*)
