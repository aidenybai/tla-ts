(*---
description: Evaluates a random record expression, seed 262, number 6671.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06671 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[<<-1, 0>> EXCEPT !.a = (7 % 7)] EXCEPT !.a = @ + (-(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE))] EXCEPT !.a = Len(SubSeq(<<3, 7>>, ([x \in Nat |-> x + 1])[7], (CHOOSE b10230 \in 2..1 : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06671 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
