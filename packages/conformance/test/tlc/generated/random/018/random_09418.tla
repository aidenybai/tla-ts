(*---
description: Evaluates a random function expression, seed 262, number 9418.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09418 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Tail(<<1, 2>>)) + (-(1 - 7))) :> LET b14607 == ((1 * 3) % Len(<<>>)) IN ((<<1, 2>> = (1 :> 2)) - CASE TRUE -> b14607 [] OTHER -> 2)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09418 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
