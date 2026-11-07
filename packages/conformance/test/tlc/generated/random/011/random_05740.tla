(*---
description: Evaluates a random function expression, seed 262, number 5740.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05740 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[<<5, 6>> EXCEPT ![<<>>] = 7] EXCEPT ![IF FALSE THEN -1 ELSE 0] = (7 - {1})] EXCEPT ![((-3) % (1 \div 1))] = (CASE TRUE -> 7 [] OTHER -> 7 * (2 + -1))] EXCEPT ![Len(((2147483647 :> -1))[(7 \div 2147483647)])] = (Len(Append(<<1, 2>>, 7)) + Len((<<1>> \o 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05740 failed.
    Attempted to access tuple at a non integral index: <<>>
---*)
