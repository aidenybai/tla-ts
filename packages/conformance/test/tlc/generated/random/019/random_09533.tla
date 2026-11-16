(*---
description: Evaluates a random record expression, seed 262, number 9533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + ((([a |-> 1]).a * (2147483647 * 7)) * (CHOOSE b14816 \in {2147483647, 2} : (FALSE <=> FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09533 failed.
    2178:0 Overflow when computing 2147483647*7
---*)
