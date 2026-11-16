(*---
description: Evaluates a random record expression, seed 262, number 8111.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08111 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + (CHOOSE b12536 \in DOMAIN <<5, 6>> : (\E b12537 \in b12536 : FALSE))] EXCEPT !.a = ([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = Head(<<>>)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08111 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_08111
---*)
