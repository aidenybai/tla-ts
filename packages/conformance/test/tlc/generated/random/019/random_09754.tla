(*---
description: Evaluates a random function expression, seed 262, number 9754.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09754 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15138 \in {LET b15140 == (2 \div 3) IN Len(<<1, 2>>) : b15139 \in {b15141 \in {b15142 : b15142 \in {x \in 1..3 : x > 1}} : (FALSE => FALSE)}} |-> ([[a |-> 1, b |-> FALSE] EXCEPT !.a = (b15138 % 2)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 0)"
---*)
