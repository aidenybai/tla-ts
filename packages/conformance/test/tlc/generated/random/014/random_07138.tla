(*---
description: Evaluates a random int expression, seed 262, number 7138.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07138 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(2147483647 :> 3) EXCEPT !.a = (CHOOSE b10964 \in {x \in 1..3 : x > 1} : FALSE)] EXCEPT !.a = Head(SubSeq(<<1, 2>>, 1, 0))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07138 failed.
    Attempted to check equality of integer 2147483647 with non-integer:
    "a"
---*)
