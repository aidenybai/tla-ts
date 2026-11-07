(*---
description: Evaluates a random int expression, seed 262, number 6824.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06824 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{1} -> {1}] : TRUE), UNION {((0 .. 7) \cap {b10456 : b10456 \in {x \in 1..3 : x > 1}}), {b10457 \in (3 .. 0) : ({1} \subseteq {x \in 1..3 : x > 1})}}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
