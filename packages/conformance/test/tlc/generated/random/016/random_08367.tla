(*---
description: Evaluates a random record expression, seed 262, number 8367.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08367 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(2 - 2) EXCEPT !.a = (2 - 2)] EXCEPT !.a = LET b12940 == (7 - 2) IN (-1)] EXCEPT !.a = (Len(Tail(<<1, 2>>)) * ((2 - 0) % (CHOOSE b12941 \in {2, 1, 3} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08367 failed.
    Attempted to apply EXCEPT construct to the value 0.
---*)
