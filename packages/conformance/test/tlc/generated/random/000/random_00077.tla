(*---
description: Evaluates a random function expression, seed 262, number 77.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00077 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((CHOOSE b115 \in {} : FALSE) :> (0 - 3)) EXCEPT ![LET b116 == (1 \in {2, 1, 3}) IN CASE TRUE -> b116 [] OTHER -> 3] = ({b117 \in {2, 1, 3} : FALSE} \cup (Nat \cup 1..3))] EXCEPT ![(CHOOSE b118 \in UNION {({2, 1, 3} \cup SUBSET {1}), (Nat \subseteq {})} : ((2 - b118) <=> (\E b119 \in SUBSET {1} : TRUE)))] = Cardinality(UNION {({} \cup {1, 2}), {(1 :> 2), -1}})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00077 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 45 of module random_00077
---*)
