(*---
description: Evaluates a random int expression, seed 262, number 7080.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07080 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) EXCEPT ![(-0)] = [[a |-> 1] EXCEPT !.a = 3]] @@ (CHOOSE f \in [{} -> {}] : TRUE)))[(CHOOSE b10874 \in (UNION {{1}, {}} \ UNION {SUBSET {1}, {1}}) : ((b10874 \div b10874) < (2147483647 \div 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 61 of module random_07080
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07080 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 148 to line 14, col 255 of module random_07080
---*)
