(*---
description: Evaluates a random seq expression, seed 262, number 4721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b7381 \in (((CHOOSE b7382 \in {x \in 1..3 : x > 1} : FALSE) .. LET b7383 == 1 IN b7383) \cap ((-1 - 0) .. SubSeq(<<>>, 7, -1))) : ((SubSeq([x \in Nat |-> x + 1], b7381, b7381) = (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)) <=> ({b7381, FALSE} \subseteq (1..3 \cup {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04721 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 33 to line 14, col 77 of module random_04721
---*)
