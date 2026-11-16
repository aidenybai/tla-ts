(*---
description: Evaluates a random record expression, seed 262, number 4681.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04681 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (([[a |-> 1] EXCEPT !.a = @ + -1] * (2147483647 \div 0)) < ((3 \div 3) - ((1 :> 2))[1])), b |-> ({([a |-> 1, b |-> TRUE]).a, LET b7317 == 7 IN b7317} = UNION {{2147483647, 2147483647}, ({1} .. 2)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04681 failed.
    2179:0 The second argument of \div is 0.
---*)
