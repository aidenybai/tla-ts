(*---
description: Evaluates a random int expression, seed 262, number 4531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b7116 == ((IF FALSE THEN 3 ELSE 2 % CASE TRUE -> 0 [] OTHER -> 1) :> ([[a |-> 1] EXCEPT !.a = 2147483647]).a) IN (((b7116 % b7116) % (7 % b7116)) \div ([<<3, 1, 2>> EXCEPT ![1] = 2]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
