(*---
description: Evaluates a random bool expression, seed 262, number 6655.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06655 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10209 \in (({0, 7} \ {2147483647, -1}) \ (CASE TRUE -> 2 [] OTHER -> 2 \in UNION {{1, 2}, SUBSET {1}})) : ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [a |-> (b10209 * b10209), b |-> (SUBSET {1} <=> TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06655 failed.
    Attempted to check if the value:
    0
    is an element of the integer 2
---*)
