(*---
description: Evaluates a random int expression, seed 262, number 4832.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04832 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7542 \in ({x \in 1..3 : x > 1} \ {}) : (2 < b7542)) * (-IF FALSE THEN 2 ELSE 0)) + IF ([[a |-> 1] EXCEPT !.a = @ + -1] \in ({x \in 1..3 : x > 1} \cap 1..3)) THEN (LET b7543 == 7 IN 0 .. ((1 :> 2) - 0)) ELSE CASE (\E b7544 \in 2..1 : FALSE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> CASE TRUE -> 0 [] OTHER -> 7))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04832 failed.
    Attempted to compare record:
    [a |-> 0]
    with non-record
    3
---*)
