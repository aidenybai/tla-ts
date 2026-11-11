(*---
description: Evaluates a random int expression, seed 262, number 4611.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04611 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({b7221 \in UNION {DOMAIN (1 :> 2), UNION {{x \in 1..3 : x > 1}, {1}}} : ((-1 + b7221) \in ({2, 1, 3} \cap 2..1))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
