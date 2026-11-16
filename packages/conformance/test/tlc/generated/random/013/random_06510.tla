(*---
description: Evaluates a random set expression, seed 262, number 6510.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06510 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (((CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE))[Cardinality(2..1)] :> CASE (\E b10006 \in SUBSET {1} : <<1, 2>>) -> (0 * 7) [] OTHER -> (1 % -1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06510 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 70 of module random_06510
---*)
