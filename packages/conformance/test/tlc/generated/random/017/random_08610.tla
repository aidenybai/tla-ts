(*---
description: Evaluates a random record expression, seed 262, number 8610.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08610 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b13337 \in UNION {DOMAIN (1 :> 2), {b13338 \in SUBSET {1} : FALSE}} : (~(<<1, 2>> = [x \in 1..2 |-> x]))), b |-> ((<<0, 2147483647>> \o Append(<<>>, <<>>)) => ((TRUE /\ TRUE) /\ (7 = 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08610 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 134 of module random_08610
---*)
