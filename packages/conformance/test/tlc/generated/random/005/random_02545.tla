(*---
description: Evaluates a random record expression, seed 262, number 2545.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02545 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + Head(Tail(<<3, 1, 2>>))] EXCEPT !.a = (CHOOSE b4015 \in {b4016 \in ({x \in 1..3 : x > 1} \cup 1..3) : (1 \in {x \in 1..3 : x > 1})} : ((b4015 < b4015) /\ (1..3 = {})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02545 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 109 to line 14, col 235 of module random_02545
---*)
