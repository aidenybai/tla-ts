(*---
description: Evaluates a random int expression, seed 262, number 5885.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05885 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((\A b9079 \in 1..3 : FALSE) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1])) => ({b9080 \in {1} : TRUE} = {7, 2147483647})) THEN (CASE (~<<1>>) -> (2147483647 + -1) [] OTHER -> (1 + 0) - (CHOOSE b9081 \in ({2, 1, 3} \ {1}) : (~TRUE))) ELSE (LET b9082 == CASE TRUE -> 3 [] OTHER -> 2147483647 IN (b9082 % b9082) * Head(SubSeq(<<1, 2>>, 3, 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05885 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a tuple)
    line 14, col 148 to line 14, col 153 of module random_05885
---*)
