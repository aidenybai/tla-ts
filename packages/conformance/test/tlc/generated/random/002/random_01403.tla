(*---
description: Evaluates a random bool expression, seed 262, number 1403.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01403 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = <<>>] EXCEPT !.a = (0 + 2)]).a = ((CASE FALSE -> 2147483647 [] OTHER -> -1 + CASE FALSE -> 2147483647 [] OTHER -> 2147483647) \div (([x \in 1..2 |-> x])[0] - Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01403 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
