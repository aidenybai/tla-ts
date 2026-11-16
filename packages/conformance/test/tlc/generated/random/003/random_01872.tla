(*---
description: Evaluates a random int expression, seed 262, number 1872.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01872 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (1..3 = {2, 1, 3}) -> (1 - 2147483647) [] OTHER -> LET b2948 == <<5, 6>> IN 3 - Len(([a |-> 1] = [a |-> 1, b |-> TRUE]))) * ((([x \in Nat |-> x + 1] @@ <<5, 6>>))[(2 % 2147483647)] \div (Head(<<1>>) + IF TRUE THEN 3 ELSE {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01872 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
