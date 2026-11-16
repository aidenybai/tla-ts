(*---
description: Evaluates a random function expression, seed 262, number 9078.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09078 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14102 \in UNION {(LET b14103 == 7 IN 0 .. (0 * 7)), ({b14104 \in {2, 1, 3} : TRUE} \cap {7, 2})} |-> (((b14102 :> 2147483647))[IF TRUE THEN b14102 ELSE 0] - (([a |-> 1, b |-> TRUE]).a * (b14102 % [a |-> 1])))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b14102 \\in {0, 2} |-> <expression line 14, col 120 to line 14, col 224 of module random_09078>]"
---*)
