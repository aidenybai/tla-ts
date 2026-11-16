(*---
description: Evaluates a random function expression, seed 262, number 8073.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12476 \in DOMAIN ((CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE) @@ (CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE)) |-> (Head(Append(<<1, 2>>, 3)) - IF (7 < b12476) THEN (1 \div b12476) ELSE Head(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08073 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 87 to line 14, col 126 of module random_08073
---*)
