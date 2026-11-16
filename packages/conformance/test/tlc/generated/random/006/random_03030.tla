(*---
description: Evaluates a random function expression, seed 262, number 3030.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03030 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE f \in [{1, 2} -> 2..1] : TRUE) EXCEPT ![(<<5, 6>> % -1)] = (2 \div 1)] @@ ((3 * 7) :> Len(<<>>))) @@ LET b4816 == (-LET b4817 == 7 IN 1) IN Cardinality(DOMAIN [x \in Nat |-> x + 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03030 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 55 of module random_03030
---*)
