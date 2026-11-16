(*---
description: Evaluates a random set expression, seed 262, number 9655.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09655 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b14994 \in ((Head(<<1>>))[CASE FALSE -> 1 [] OTHER -> 2147483647] .. Cardinality(UNION {1..3, {x \in 1..3 : x > 1}})) : (~((CHOOSE r \in [a : 2..1] : TRUE) = [[x \in 1..2 |-> x] EXCEPT !.a = @ + 1]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09655 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 29 to line 14, col 81 of module random_09655
---*)
