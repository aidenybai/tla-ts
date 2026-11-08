(*---
description: Evaluates a random record expression, seed 262, number 2918.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02918 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[IF (2..1 < 1) THEN (-1 \div 1) ELSE (1 - -1) EXCEPT !.a = ((CHOOSE b4611 \in {} : TRUE) + Cardinality(2..1))] EXCEPT !.a = @ + (((-1 \div 1) * (-1)) \div LET b4612 == (-1 - -1) IN Len(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02918 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    {}
---*)
