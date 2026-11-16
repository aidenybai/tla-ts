(*---
description: Evaluates a random record expression, seed 262, number 703.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00703 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[FALSE EXCEPT !.a = @ + 0] EXCEPT !.a = [(1 :> 2) EXCEPT ![3] = 0]] EXCEPT !.a = @ + Head([<<1, 2>> EXCEPT ![1] = 2147483647])] EXCEPT !.a = IF ((7 - 3) = (3 \div 3)) THEN Head([<<1, 2>> EXCEPT ![1] = 0]) ELSE ((1 + 2) * Head(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00703 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
