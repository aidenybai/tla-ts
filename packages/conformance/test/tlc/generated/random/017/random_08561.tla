(*---
description: Evaluates a random set expression, seed 262, number 8561.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08561 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((-b13263) - ([a |-> 1]).a) : b13263 \in {(b13264 * b13264) : b13264 \in (3 .. 1)}} \cup (([a |-> 7, b |-> FALSE]).a .. (-LET b13265 == 2147483647 IN b13265))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
