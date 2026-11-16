(*---
description: Evaluates a random function expression, seed 262, number 1696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE) @@ (CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE)) EXCEPT ![(CHOOSE b2706 \in (3 .. 0) : (7 = b2706))] = LET b2707 == (CHOOSE b2708 \in {2, 1, 3} : FALSE) IN ([a |-> 1]).a] @@ [(CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE) EXCEPT ![(CASE TRUE -> 2 [] OTHER -> 0 - (3 + 3))] = CASE (~TRUE) -> Cardinality({2, 1, 3}) [] OTHER -> (1 - TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01696 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 68 to line 14, col 109 of module random_01696
---*)
