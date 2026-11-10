(*---
description: Evaluates a random set expression, seed 262, number 5223.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05223 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\A b8099 \in 2..1 : FALSE) THEN ((1 :> 2))[1] ELSE (1 * 2147483647) * Head((<<1, 2>> \o <<3, 1, 2>>))) .. (((-2) + (7 % 2147483647)) + (CASE FALSE -> 7 [] OTHER -> 0 \div ([x \in 1..2 |-> x])[-1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05223 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    -1
    which is not in its domain.
---*)
