(*---
description: Evaluates a random set expression, seed 262, number 640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1..3 \ 2..1) \ {b1068 \in [a |-> 1] : FALSE}) \cap {(3 - b1069) : b1069 \in UNION {{1}, {2, 1, 3}}}) .. ((([x \in Nat |-> x + 1] @@ (1 :> 2)))[(0 + -1)] + LET b1070 == (3 % 3) IN (CHOOSE b1071 \in 1..3 : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00640 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
---*)
