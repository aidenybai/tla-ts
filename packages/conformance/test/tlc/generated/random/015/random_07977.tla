(*---
description: Evaluates a random seq expression, seed 262, number 7977.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07977 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality(DOMAIN (CHOOSE f \in [{} -> {2, 1, 3}] : TRUE)), ([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (3 \div 2147483647)]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07977 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 82 to line 14, col 111 of module random_07977
---*)
