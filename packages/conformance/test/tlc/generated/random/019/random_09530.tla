(*---
description: Evaluates a random record expression, seed 262, number 9530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[1..3 EXCEPT !.a = @ + 7] EXCEPT !.a = CASE FALSE -> 2147483647 [] OTHER -> 1] EXCEPT !.a = @ + ((2 \div [a |-> 1, b |-> TRUE]) * (2147483647 + 1))] EXCEPT !.a = ((-CASE TRUE -> 2 [] OTHER -> 7) :> Head(SubSeq(<<3, 1, 2>>, 3, 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09530 failed.
    Attempted to apply EXCEPT construct to the value 1..3.
---*)
