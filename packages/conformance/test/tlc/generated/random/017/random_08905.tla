(*---
description: Evaluates a random function expression, seed 262, number 8905.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08905 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE] @@ [x \in 1..2 |-> x]))[Head(<<1, 2>>)] - IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (1 % 3) ELSE (0 % 1)) :> (((CHOOSE b13793 \in 2..1 : FALSE) * (7 * 1)) * (LET b13794 == [a |-> 1] IN 3 \div CASE FALSE -> 7 [] OTHER -> -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08905 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
