(*---
description: Evaluates a random function expression, seed 262, number 6912.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06912 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([(<<5, 6>> @@ [x \in Nat |-> x + 1]) EXCEPT ![CASE [a |-> 1, b |-> TRUE] -> 7 [] OTHER -> 0] = Head(<<3, 1, 2>>)] @@ ([b10577 \in {x \in 1..3 : x > 1} |-> b10577] @@ [b10578 \in {x \in 1..3 : x > 1} |-> b10578])) EXCEPT ![Len([SortSeq(<<1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (0 \div 2)])] = Head([Append(<<3, 1, 2>>, -1) EXCEPT ![1] = (7 \div 1)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06912 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
