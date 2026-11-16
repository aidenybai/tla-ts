(*---
description: Evaluates a random record expression, seed 262, number 9289.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09289 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (LET b14417 == (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) IN Tail(<<1, 2>>) - (CHOOSE b14418 \in {7 : b14419 \in 1..3} : (FALSE /\ FALSE))), b |-> (((7 % 2) + (SUBSET {1})[2147483647]) < ((-3) \div (CHOOSE b14420 \in {x \in 1..3 : x > 1} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09289 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 107 to line 14, col 164 of module random_09289
---*)
