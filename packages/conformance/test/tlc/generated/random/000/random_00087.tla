(*---
description: Evaluates a random function expression, seed 262, number 87.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00087 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b136 \in Append([[<<1>> EXCEPT ![1] = 2147483647] EXCEPT ![1] = Cardinality({x \in 1..3 : x > 1})], ((0 * 7) - (7 * 2))) |-> Head(Tail(Tail(<<1>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b136 \\in <<2, -14>> |-> <expression line 14, col 142 to line 14, col 164 of module random_00087>]"
---*)
