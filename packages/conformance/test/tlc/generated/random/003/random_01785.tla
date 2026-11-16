(*---
description: Evaluates a random int expression, seed 262, number 1785.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01785 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a]).a \div LET b2825 == (CHOOSE b2826 \in (Nat \cap {1}) : (b2826 \in {x \in 1..3 : x > 1})) IN LET b2827 == (b2825 \div b2825) IN ((1 :> 2))[2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01785 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
