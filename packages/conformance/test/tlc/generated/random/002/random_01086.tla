(*---
description: Evaluates a random function expression, seed 262, number 1086.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01086 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1730 \in {b1731 \in SelectSeq(SubSeq(<<>>, 2147483647, 3), LAMBDA e : e > 0) : ((~TRUE) /\ (\A b1732 \in {1, 2} : FALSE))} |-> [[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b1730] EXCEPT !.a = @ + (-1 % -1)] EXCEPT !.a = @ + [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b1730] EXCEPT !.a = @ + (b1730 \div 1)]]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b1730 \\in {b1731 \\in <<>> : <expression line 14, col 98 to line 14, col 137 of module random_01086> } |-> <expression line 14, col 145 to line 14, col 319 of module random_01086>]"
---*)
