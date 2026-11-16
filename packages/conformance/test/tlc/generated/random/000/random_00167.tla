(*---
description: Evaluates a random int expression, seed 262, number 167.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00167 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b263 == CASE (\A b264 \in {b265 \in {x \in 1..3 : x > 1} : TRUE} : (\E b266 \in 2..1 : TRUE)) -> ((2147483647 \div 2147483647) % CASE TRUE -> 1 [] OTHER -> 3) [] OTHER -> (([x \in 1..2 |-> x])[-1] * Len(<<>>)) IN Cardinality({b267 \in {7 : b268 \in 2..1} : (TRUE \/ TRUE)}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
