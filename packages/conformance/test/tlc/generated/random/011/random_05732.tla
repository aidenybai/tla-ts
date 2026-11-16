(*---
description: Evaluates a random set expression, seed 262, number 5732.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05732 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b8818 \in {LET b8820 == -1 IN b8820 : b8819 \in {0, -1}} : ({b8821 \in {} : TRUE} \subseteq {b8822 \in SUBSET {1} : TRUE})} \ {((CHOOSE b8824 \in 1..3 : FALSE) - (Nat \div b8823)) : b8823 \in (UNION {{x \in 1..3 : x > 1}, {}} \cup {b8825 : b8825 \in 2..1})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05732 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 147 to line 14, col 175 of module random_05732
---*)
