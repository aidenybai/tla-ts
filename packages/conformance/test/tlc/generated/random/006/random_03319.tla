(*---
description: Evaluates a random int expression, seed 262, number 3319.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03319 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b5275 == [((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE) @@ (CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE)) EXCEPT ![(IF TRUE THEN 1 ELSE 3 + CASE FALSE -> -1 [] OTHER -> 0)] = ((1 * <<3, 1, 2>>) + (-2147483647))] IN (CASE (FALSE /\ FALSE) -> (b5275 % b5275) [] OTHER -> (<<5, 6>>)[3])[Cardinality({b5276 \in 1..3 : FALSE})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03319 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
