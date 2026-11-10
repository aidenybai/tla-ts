(*---
description: Evaluates a random int expression, seed 262, number 7168.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07168 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<3, 1, 2>>) :> (0 * 3)))[((-3) \div (CHOOSE b11015 \in 1..3 : TRUE))] + ([a |-> ({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1}), b |-> ([x \in 1..2 |-> x] = (1 :> 2))]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07168 failed.
    Attempted to apply function:
    (3 :> 0)
    to argument -3, which is not in the domain of the function.
---*)
