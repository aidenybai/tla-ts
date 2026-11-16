(*---
description: Evaluates a random int expression, seed 262, number 6141.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06141 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([([TRUE EXCEPT ![1..3] = [a |-> 1, b |-> TRUE]] @@ (CHOOSE f \in [{1, 2} -> 2..1] : TRUE)) EXCEPT ![((0 :> -1))[(0 + 0)]] = (Len(<<1>>) \div (2147483647 % 0))])[(LET b9440 == Head(<<3, 1, 2>>) IN CASE TRUE -> b9440 [] OTHER -> b9440 - (-(-1 + 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06141 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
