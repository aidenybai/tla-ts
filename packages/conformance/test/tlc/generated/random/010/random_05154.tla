(*---
description: Evaluates a random bool expression, seed 262, number 5154.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05154 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b8001 \in {(CHOOSE b8002 \in ({} \ 2..1) : (2147483647 < b8002)), (CHOOSE b8003 \in {0, 2147483647} : ([a |-> 1] \o <<1>>))} : ({([a |-> 1] - b8001), (b8001 + b8001)} = (UNION {2..1, <<1, 2>>} \cup DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05154 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 32 to line 14, col 82 of module random_05154
---*)
