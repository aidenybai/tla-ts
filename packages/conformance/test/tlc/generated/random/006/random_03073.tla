(*---
description: Evaluates a random int expression, seed 262, number 3073.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((TRUE \/ TRUE) <=> (TRUE \/ FALSE)) -> (CHOOSE b4875 \in ({x \in 1..3 : x > 1} \cup 2..1) : ([x \in 1..2 |-> x] = b4875)) [] OTHER -> ([a |-> 2147483647, b |-> TRUE]).a * ([b4876 \in {1, -1} |-> ((1 :> 2))[2]])[(IF FALSE THEN TRUE ELSE 1 - (2 * 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03073 failed.
    Attempted to check equality of the function <<1, 2>> with the value:
    2
---*)
