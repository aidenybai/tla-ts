(*---
description: Evaluates a random bool expression, seed 262, number 6023.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> CASE TRUE -> 2147483647 [] OTHER -> 2, b |-> (\A b9278 \in {} : FALSE)] EXCEPT !.a = @ + (([a |-> 1]).a * ([x \in 1..2 |-> x])[1])] EXCEPT !.a = @ + (((2 + 0) % CASE <<1, 2>> -> 7 [] OTHER -> 3) - Head(Append(<<>>, -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06023 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
