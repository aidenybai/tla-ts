(*---
description: Evaluates a random int expression, seed 262, number 9563.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09563 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((7 < 3) => (<<3, 1, 2>> = <<5, 6>>)) \/ (\E b14850 \in ({x \in 1..3 : x > 1} \ {1, 2}) : (TRUE \/ TRUE))) THEN CASE {(3 % 2147483647), ((1 :> 2))[-1]} -> ((7 - 3) + (Nat \subseteq 2..1)) [] OTHER -> ([a |-> 3, b |-> FALSE]).a ELSE (CHOOSE b14851 \in {([a |-> 1, b |-> TRUE]).a, (3 - FALSE)} : ([[a |-> 1] EXCEPT !.a = 2147483647] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = b14851])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09563 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
