(*---
description: Evaluates a random int expression, seed 262, number 2306.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02306 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b3644 \in {([x \in 1..2 |-> x])[2147483647], (CHOOSE b3645 \in [a |-> 1, b |-> TRUE] : FALSE)} : (CASE FALSE -> b3644 [] OTHER -> b3644 < (b3644 % b3644))) THEN [a |-> (CHOOSE b3646 \in {7, 2} : ({1, 2} \subseteq 2..1)), b |-> (~(2 \in {1}))] ELSE IF (~(-1 < 7)) THEN (CHOOSE b3647 \in Tail(0) : (~TRUE)) ELSE ((<<5, 6>>)[0] \div (1 + (1 :> 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02306 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
