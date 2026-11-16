(*---
description: Evaluates a random function expression, seed 262, number 9455.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09455 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14674 \in {(CHOOSE b14676 \in b14675 : TRUE) : b14675 \in ({} \cap 2..1)} : (LET b14677 == b14674 IN b14674 \in {b14678 \in {1} : TRUE})) :> (((CHOOSE b14679 \in SUBSET {1} : TRUE) * (CHOOSE r \in [a : {1}] : TRUE)) * LET b14680 == ([a |-> 1, b |-> TRUE]).a IN (2 + b14680))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09455 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 161 of module random_09455
---*)
