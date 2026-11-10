(*---
description: Evaluates a random record expression, seed 262, number 51.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00051 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (CHOOSE b72 \in {(2 % b73) : b73 \in {2147483647, 3}} : [[[x \in 1..2 |-> x] EXCEPT ![b72] = 0] EXCEPT ![(CHOOSE b74 \in {1} : FALSE)] = Head(<<1, 2>>)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00051 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_00051
---*)
