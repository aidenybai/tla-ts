(*---
description: Evaluates a random function expression, seed 262, number 1969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3118 \in UNION {{b3119 \in {b3120 : b3120 \in {1}} : (\E b3121 \in 1..3 : FALSE)}, DOMAIN [[x \in 1..2 |-> x] EXCEPT ![1] = 1]} |-> (-Cardinality((TRUE \/ FALSE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b3118 \\in {1, 2} |-> <expression line 14, col 151 to line 14, col 179 of module random_01969>]"
---*)
