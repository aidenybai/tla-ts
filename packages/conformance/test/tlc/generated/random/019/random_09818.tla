(*---
description: Evaluates a random function expression, seed 262, number 9818.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09818 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15244 \in Tail([<<2147483647, 2147483647>> EXCEPT ![1] = (-1 \div 3)]) |-> IF ({b15244, 0} \subseteq (b15244 .. 2147483647)) THEN (CHOOSE b15245 \in ({1, 2} \ 1..3) : (FALSE <=> FALSE)) ELSE ((-b15244) % ([a |-> 1, b |-> TRUE]).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b15244 \\in <<2147483647>> |-> <expression line 14, col 93 to line 14, col 247 of module random_09818>]"
---*)
