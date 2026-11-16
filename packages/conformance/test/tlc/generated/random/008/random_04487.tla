(*---
description: Evaluates a random function expression, seed 262, number 4487.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04487 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(CHOOSE b7052 \in SUBSET {1} : FALSE)) - Len((CHOOSE f \in [{1, 2} -> 1..2] : TRUE))) :> (((7 * 2) - ([x \in Nat |-> x + 1])[1]) % (-CASE FALSE -> -1 [] OTHER -> 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04487 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 55 of module random_04487
---*)
