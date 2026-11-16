(*---
description: Evaluates a random set expression, seed 262, number 5443.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05443 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b8430 \in ((0 < 2) <=> (\E b8431 \in 2..1 : FALSE)) : (CHOOSE r \in [a : {}] : TRUE)} \cup {b8432 \in ((1 * 1) .. (CHOOSE b8433 \in {} : TRUE)) : (\E b8434 \in ({1, 2} \ 1..3) : (~TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05443 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 133 to line 14, col 158 of module random_05443
---*)
