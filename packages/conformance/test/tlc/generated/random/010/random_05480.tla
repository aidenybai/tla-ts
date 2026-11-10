(*---
description: Evaluates a random record expression, seed 262, number 5480.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05480 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1})), b |-> ({b8476 \in SUBSET {1} : TRUE} = (2147483647 .. 3))] EXCEPT !.a = (CHOOSE b8477 \in {(-1 - <<5, 6>>) : b8478 \in {b8479 \in {x \in 1..3 : x > 1} : FALSE}} : ({b8477 : b8480 \in {1}} => ({} = {1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05480 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 160 to line 14, col 291 of module random_05480
---*)
