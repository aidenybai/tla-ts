(*---
description: Evaluates a random record expression, seed 262, number 1289.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01289 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b2051 \in {b2052 \in {b2053 \in {} : TRUE} : ({} = SUBSET {1})} : (~(FALSE <=> TRUE))), b |-> (~((FALSE => TRUE) /\ (1..3 \subseteq {x \in 1..3 : x > 1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01289 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 115 of module random_01289
---*)
