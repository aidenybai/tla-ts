(*---
description: Evaluates a random int expression, seed 262, number 6162.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06162 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b9479 == LET b9480 == Head([<<1, 2>> EXCEPT ![1] = 2147483647]) IN Cardinality((b9480 - b9480)) IN Head(((<<1>> \o <<1, 2>>) = ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06162 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
