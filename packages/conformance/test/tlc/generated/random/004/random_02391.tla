(*---
description: Evaluates a random function expression, seed 262, number 2391.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02391 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3790 \in ((({x \in 1..3 : x > 1} \subseteq {2, 1, 3}) <=> (\A b3791 \in 2..1 : FALSE)) \/ ([[a |-> 1] EXCEPT !.a = 0] <=> (1..3 = Nat))) |-> Head(<<CASE FALSE -> 1 [] OTHER -> b3790, (7 % 3)>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b3790 \\in TRUE |-> <expression line 14, col 159 to line 14, col 210 of module random_02391>]"
---*)
