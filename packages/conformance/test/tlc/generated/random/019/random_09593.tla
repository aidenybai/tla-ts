(*---
description: Evaluates a random record expression, seed 262, number 9593.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09593 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (([[a |-> 1] EXCEPT !.a = 3]).a + (CASE TRUE -> 2147483647 [] OTHER -> 2147483647 :> LET b14896 == 1 IN 2)), b |-> (~(CASE TRUE -> -1 [] OTHER -> 1 < (<<5, 6>>)[3]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09593 failed.
    2178:0 Overflow when computing 3+2147483647
---*)
