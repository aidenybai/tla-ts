(*---
description: Evaluates a random record expression, seed 262, number 9316.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09316 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + (SubSeq(Append(<<>>, 0), ([x \in Nat |-> x + 1])[3], (-3))).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09316 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
