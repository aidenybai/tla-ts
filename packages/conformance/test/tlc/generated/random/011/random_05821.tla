(*---
description: Evaluates a random seq expression, seed 262, number 5821.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05821 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[<<2147483647, 2>> EXCEPT ![1] = (-0)] EXCEPT ![1] = (((1 :> 2) @@ <<5, 6>>))[(-1 % 1)]] \o <<((3 + 7) - Cardinality({1, 2})), LET b8975 == (0 \div 3) IN Cardinality(1..3)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05821 failed.
    Attempted to apply function:
    <<2, 6>>
    to argument 0, which is not in the domain of the function.
---*)
