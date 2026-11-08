(*---
description: Evaluates a random record expression, seed 262, number 3018.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03018 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> CASE FALSE -> 2147483647 [] OTHER -> -1, b |-> (<<>> = [x \in 1..2 |-> x])] EXCEPT !.a = ([[a |-> 1] EXCEPT !.a = @ + 2147483647] \div CASE TRUE -> 0 [] OTHER -> 2147483647)] EXCEPT !.a = LET b4800 == Head([b4801 \in {2, 1, 3} |-> 1]) IN (CHOOSE b4802 \in (1 .. b4800) : (1 .. 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03018 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
