(*---
description: Evaluates a random seq expression, seed 262, number 5952.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05952 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((IF FALSE THEN [a |-> 1, b |-> TRUE] ELSE 2147483647)[((1 :> 2))[1]] \div (CHOOSE b9180 \in ({1, 2} \cap [x \in 1..2 |-> x]) : ([a |-> 1, b |-> TRUE] = [a |-> 1]))), (-CASE (SUBSET {1} = {x \in 1..3 : x > 1}) -> (-1 + 2) [] OTHER -> (2147483647 % 1))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05952 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 19 to line 14, col 86 of module random_05952
---*)
