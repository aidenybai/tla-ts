(*---
description: Evaluates a random function expression, seed 262, number 687.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00687 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((1..3 \ {2, 1, 3}) \cap {b1151 \in TRUE : FALSE}) EXCEPT ![(CHOOSE b1152 \in {3, 2147483647} : (~TRUE))] = ((-2147483647) - (<<5, 6>>)[0])] EXCEPT ![(LET b1153 == IF TRUE THEN 2 ELSE 2 IN (2147483647 % 2) % Head(Tail(<<3, 1, 2>>)))] = (CHOOSE b1154 \in (CHOOSE r \in [a : 1..2] : TRUE) : ((FALSE /\ TRUE) <=> (SUBSET {1} = 1..3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00687 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 79 to line 14, col 120 of module random_00687
---*)
