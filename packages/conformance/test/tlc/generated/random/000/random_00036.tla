(*---
description: Evaluates a random set expression, seed 262, number 36.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head([<<1, 2>> EXCEPT ![1] = 1]) - LET b54 == (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) IN (CHOOSE b55 \in {} : FALSE)) .. (-CASE (FALSE /\ TRUE) -> (1 - <<5, 6>>) [] OTHER -> (2 % 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00036 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 112 to line 14, col 136 of module random_00036
---*)
