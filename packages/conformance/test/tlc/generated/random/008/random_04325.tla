(*---
description: Evaluates a random function expression, seed 262, number 4325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE) EXCEPT ![(Cardinality(DOMAIN (1 :> 2)) * LET b6817 == (-1 + -1) IN CASE TRUE -> b6817 [] OTHER -> <<1>>)] = ((-(3 + 2147483647)) - ((2147483647 + 2) + ([x \in 1..2 |-> x])[0]))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 59 of module random_04325
    | (2 :> 1)
---*)
