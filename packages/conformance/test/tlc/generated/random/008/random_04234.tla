(*---
description: Evaluates a random int expression, seed 262, number 4234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b6656 \in ({(b6657 % b6657) : b6657 \in DOMAIN <<5, 6>>} \cap (CHOOSE r \in [a : 2..1] : TRUE)) : ((SubSeq(<<1, 2>>, b6656, 2147483647) = [b6658 \in {} |-> 1]) => ((\A b6659 \in 1..3 : TRUE) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04234 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 87 to line 14, col 116 of module random_04234
---*)
