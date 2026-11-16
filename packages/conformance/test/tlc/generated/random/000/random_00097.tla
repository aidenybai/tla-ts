(*---
description: Evaluates a random set expression, seed 262, number 97.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00097 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b146 \in UNION {({7 : b147 \in 2..1} \ {b148 : b148 \in {1}}), (({1, 2} \ 2..1) \cup {b149 : b149 \in 1..3})} : ((\A b150 \in DOMAIN (1 :> 2) : (b146 \in Nat)) /\ (CHOOSE f \in [2..1 -> {}] : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00097 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 130 to line 14, col 213 of module random_00097
---*)
