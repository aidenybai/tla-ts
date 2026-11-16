(*---
description: Evaluates a random int expression, seed 262, number 3180.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03180 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b5063 \in ({-1, 2} \cap ({x \in 1..3 : x > 1} \cap {1})) : (\A b5064 \in (SUBSET {1} \cup {1, 2}) : (\A b5065 \in {x \in 1..3 : x > 1} : TRUE))) \div IF ((2147483647 \in Nat) <=> (7 < 1)) THEN CASE (7 = 3) -> Cardinality(2..1) [] OTHER -> (-1 % 2) ELSE (Len(<<>>) - Len([a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03180 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 167 of module random_03180
---*)
