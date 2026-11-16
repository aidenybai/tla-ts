(*---
description: Evaluates a random int expression, seed 262, number 1139.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01139 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] = [a |-> 7, b |-> FALSE]) -> ((-1 \div 2) % Len(<<>>)) [] OTHER -> LET b1826 == (CHOOSE b1827 \in {x \in 1..3 : x > 1} : TRUE) IN (1 \div b1826)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
