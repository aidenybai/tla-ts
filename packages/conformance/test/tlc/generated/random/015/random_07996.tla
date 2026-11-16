(*---
description: Evaluates a random record expression, seed 262, number 7996.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07996 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {[[a |-> 1] EXCEPT !.a = @ + 0], ({} \ {})} \ ((2147483647 .. 0) \ {{}, 7})) \cup {([[a |-> 1] EXCEPT !.a = @ + b12343]).a : b12343 \in DOMAIN (CHOOSE f \in [1..2 -> 2..1] : TRUE)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07996 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 168 to line 14, col 201 of module random_07996
---*)
