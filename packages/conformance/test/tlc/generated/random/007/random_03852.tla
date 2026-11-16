(*---
description: Evaluates a random record expression, seed 262, number 3852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Len(Tail(<<2, 7>>)) EXCEPT !.a = @ + (([[x \in 1..2 |-> x] EXCEPT ![1] = -1])[(CHOOSE r \in [a : {}] : TRUE)] % (CHOOSE b6066 \in {7, 0} : (CHOOSE f \in [2..1 -> 1..2] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03852 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
