(*---
description: Evaluates a random int expression, seed 262, number 5429.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05429 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ({1, 2} = {2, 1, 3}) -> CASE FALSE -> -1 [] OTHER -> 1 [] OTHER -> ([a |-> 1]).a % (CASE FALSE -> 2 [] OTHER -> -1 * ((1 :> 2))[1])) \div (-Len(Tail(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2
---*)
