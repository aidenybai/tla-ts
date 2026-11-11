(*---
description: Evaluates a random set expression, seed 262, number 1851.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01851 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((-(7 + 0)) :> CASE (\A b2922 \in 2..1 : TRUE) -> LET b2923 == (1 :> 2) IN b2923 [] OTHER -> (0 % 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-7}"
---*)
