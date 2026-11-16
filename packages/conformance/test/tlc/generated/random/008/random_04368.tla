(*---
description: Evaluates a random set expression, seed 262, number 4368.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04368 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a .. LET b6885 == (CASE FALSE -> 2 [] OTHER -> 2 % CASE <<1, 2>> -> 2147483647 [] OTHER -> 7) IN ((b6885 :> 0))[Len(<<>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04368 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 116 to line 14, col 123 of module random_04368
---*)
