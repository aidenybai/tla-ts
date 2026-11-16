(*---
description: Evaluates a random int expression, seed 262, number 4148.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04148 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 1 ELSE -1 * CASE FALSE -> 1 [] OTHER -> -1) + (-CASE FALSE -> 7 [] OTHER -> 1)) \div ((CHOOSE f \in [1..2 -> {}] : TRUE))[((<<5, 6>> + (1 :> 2)) \div [a |-> 0, b |-> TRUE])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04148 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 120 to line 14, col 151 of module random_04148
---*)
