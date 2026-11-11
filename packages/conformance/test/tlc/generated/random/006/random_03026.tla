(*---
description: Evaluates a random function expression, seed 262, number 3026.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{} -> 1..2] : TRUE) EXCEPT ![(((2 \div 7) * (7 % 0)) - LET b4811 == IF FALSE THEN 2 ELSE 7 IN (-2))] = Cardinality(DOMAIN (7 :> 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03026 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
