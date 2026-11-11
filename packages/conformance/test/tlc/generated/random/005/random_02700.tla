(*---
description: Evaluates a random int expression, seed 262, number 2700.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02700 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b4267 \in {1, 2} : ({x \in 1..3 : x > 1} = {2, 1, 3})) % (CHOOSE b4268 \in {-1, 2147483647} : (FALSE <=> FALSE))) \div (((CHOOSE b4269 \in SUBSET {1} : TRUE) \div ([a |-> 1]).a) % IF (FALSE /\ TRUE) THEN ((1 :> 2))[1] ELSE (1 % [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02700 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 78 of module random_02700
---*)
