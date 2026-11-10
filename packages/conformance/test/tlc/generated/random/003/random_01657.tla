(*---
description: Evaluates a random bool expression, seed 262, number 1657.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01657 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<LET b2644 == 7 IN 0, Cardinality(1..3)>> = ((CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE) @@ (CHOOSE f \in [{} -> 2..1] : TRUE))) \/ (((7 + 7) = Head(<<1>>)) /\ ((1..3 \subseteq {x \in 1..3 : x > 1}) /\ ({1} \subseteq 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01657 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 65 to line 14, col 106 of module random_01657
---*)
