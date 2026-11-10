(*---
description: Evaluates a random int expression, seed 262, number 4417.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04417 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b6949 \in {Cardinality(SUBSET {1}), (CHOOSE b6950 \in {2, 1, 3} : FALSE)} : ((FALSE => FALSE) \/ (FALSE <=> TRUE))) THEN Head([[<<>> EXCEPT ![1] = 1] EXCEPT ![1] = (2 * 3)]) ELSE IF (LET b6951 == 2 IN 2147483647 = (1 \div 2)) THEN IF (TRUE <=> FALSE) THEN (1 % 0) ELSE IF TRUE THEN 0 ELSE 2 ELSE (Append(<<3, 1, 2>>, 2) + (-1 - 7)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04417 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 60 to line 14, col 93 of module random_04417
---*)
