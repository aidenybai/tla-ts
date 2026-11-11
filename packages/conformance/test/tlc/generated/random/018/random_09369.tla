(*---
description: Evaluates a random int expression, seed 262, number 9369.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09369 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b14542 == (([b14543 \in {x \in 1..3 : x > 1} |-> 2147483647])[(CHOOSE b14544 \in 2..1 : 2..1)] % ((0 \div 2) \div [a |-> 0, b |-> FALSE])) IN (-LET b14545 == Cardinality({1}) IN Cardinality({2, 1, 3})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
