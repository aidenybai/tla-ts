(*---
description: Evaluates a random set expression, seed 262, number 8544.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08544 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b13239 \in (({} \cup {2, 1, 3}) \cap (2 .. 7)) : ((1 < 3) /\ (\E b13240 \in SUBSET {1} : TRUE))} \cap {((2 * 0) - (b13241 + b13241)) : b13241 \in {LET b13243 == 1 IN b13242 : b13242 \in ({} \cup 1..3)}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
