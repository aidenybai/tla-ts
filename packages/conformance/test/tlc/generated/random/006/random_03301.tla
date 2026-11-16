(*---
description: Evaluates a random function expression, seed 262, number 3301.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03301 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({b5251 \in {1} : TRUE}) % (Len(<<3, 1, 2>>) \div (7 \div 7))) :> ([[a |-> 2147483647, b |-> FALSE] EXCEPT !.a = CASE TRUE -> 1 [] OTHER -> -1]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
