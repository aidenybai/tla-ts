(*---
description: Evaluates a random bool expression, seed 262, number 2525.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02525 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b3982 \in (~(FALSE /\ TRUE)) : (DOMAIN [a |-> 1, b |-> TRUE] \subseteq {b3983 \in SUBSET {1} : FALSE})} = UNION {DOMAIN (CHOOSE f \in [{1} -> {}] : TRUE), ((-2) .. (0 \div 3))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02525 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 139 to line 14, col 169 of module random_02525
---*)
