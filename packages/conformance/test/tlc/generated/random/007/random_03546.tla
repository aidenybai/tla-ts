(*---
description: Evaluates a random set expression, seed 262, number 3546.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03546 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (<<3, 1, 2>> /\ TRUE) -> LET b5605 == 7 IN b5605 [] OTHER -> (-1 * 7) .. ((<<>> \o <<>>) + ((1 :> 2))[1])) \cup UNION {{b5606 \in {1 : b5607 \in Nat} : (\A b5608 \in {x \in 1..3 : x > 1} : TRUE)}, ((7 .. 1) \ ({x \in 1..3 : x > 1} \cup {1, 2}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03546 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a tuple.
    line 14, col 24 to line 14, col 42 of module random_03546
---*)
