(*---
description: Evaluates a random record expression, seed 262, number 2763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + ([(3 :> -1) EXCEPT !.a = (CHOOSE b4359 \in {} : FALSE)] = (CHOOSE r \in [a : 2..1] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02763 failed.
    Attempted to check equality of integer 3 with non-integer:
    "a"
---*)
