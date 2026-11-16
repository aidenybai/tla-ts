(*---
description: Evaluates a random set expression, seed 262, number 555.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00555 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN ((7 * 0) :> LET b940 == 2147483647 IN b940), ((({1, 2} \ {2, 1, 3}) \ {b941 \in {1} : TRUE}) \cap {b942 \in DOMAIN (1 :> 2) : ({} = {})})})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {0}"
---*)
