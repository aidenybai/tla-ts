(*---
description: Evaluates a random function expression, seed 262, number 1500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{0} \cup {1} -> {}] : TRUE) EXCEPT ![(([a |-> 1]).a - (-3))] = ((1 \div 1) % ({} \cup {1}))] @@ [b2391 \in ((<<>> \cap Nat) \ ({x \in 1..3 : x > 1} \cap {1})) |-> ((7 * b2391) + (CHOOSE b2392 \in 2..1 : TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01500 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 58 of module random_01500
---*)
