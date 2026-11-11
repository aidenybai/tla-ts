(*---
description: Evaluates a random set expression, seed 262, number 4630.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04630 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7254 \in {CASE (FALSE \/ [x \in Nat |-> x + 1]) -> (2 + 0) [] OTHER -> Cardinality({x \in 1..3 : x > 1}), CASE ({x \in 1..3 : x > 1} \subseteq 1..3) -> IF TRUE THEN TRUE ELSE 2147483647 [] OTHER -> (CHOOSE b7255 \in 2..1 : FALSE)} : (({b7256 : b7256 \in Nat} \cup ({} \cup {x \in 1..3 : x > 1})) \subseteq [(CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE) EXCEPT ![(b7254 + 3)] = (Nat + 3)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04630 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a function of the form  [x \in S |-> expr].
    line 14, col 34 to line 14, col 63 of module random_04630
---*)
