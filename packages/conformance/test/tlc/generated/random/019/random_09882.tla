(*---
description: Evaluates a random record expression, seed 262, number 9882.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09882 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(-2) EXCEPT !.a = @ + CASE TRUE -> 3 [] OTHER -> 7] EXCEPT !.a = @ + (LET b15364 == 0 IN 0 % [<<5, 6>> EXCEPT ![0] = -1])]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09882 failed.
    Attempted to apply EXCEPT construct to the value -2.
---*)
