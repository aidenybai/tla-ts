(*---
description: Evaluates a random record expression, seed 262, number 5090.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05090 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + ((CHOOSE r \in [a : {}] : TRUE)).a] EXCEPT !.a = ((Len(<<3, 1, 2>>) + LET b7915 == 7 IN b7915) - (CHOOSE b7916 \in (1..3 \cup 1..3) : (2 = b7916)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05090 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 78 to line 14, col 105 of module random_05090
---*)
