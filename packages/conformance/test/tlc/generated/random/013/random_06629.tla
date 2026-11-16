(*---
description: Evaluates a random set expression, seed 262, number 6629.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06629 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE), UNION {((SUBSET {1} \ 1..3) \cap {b10181 : b10181 \in 2..1}), {b10182 \in (~FALSE) : CASE FALSE -> 2147483647 [] OTHER -> -1}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06629 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 31 to line 14, col 75 of module random_06629
---*)
