(*---
description: Evaluates a random bool expression, seed 262, number 2459.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02459 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b3870 \in SUBSET {1} : FALSE) % CASE FALSE -> 3 [] OTHER -> 3) * CASE ({2, 1, 3} \subseteq {x \in 1..3 : x > 1}) -> LET b3871 == -1 IN [a |-> 1, b |-> TRUE] [] OTHER -> (FALSE <=> TRUE)) \in {b3872 \in {b3873 \in {b3874 \in {1, 2} : FALSE} : ([a |-> 1, b |-> TRUE] = [a |-> 1])} : ({3 : b3875 \in 2..1} = DOMAIN (1 :> 2))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02459 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 54 of module random_02459
---*)
