(*---
description: Evaluates a random seq expression, seed 262, number 3873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(((<<1, 2>> \o Tail(<<3, 1, 2>>)) \o (Tail(<<3, 1, 2>>) \o SelectSeq(<<>>, LAMBDA e : e > 0))), ((Len(<<3, 1, 2>>) \div (<<5, 6>> @@ [x \in Nat |-> x + 1])) + (Len(<<1, 2>>) - (-1))), IF (Head(<<1, 2>>) = ([a |-> 1]).a) THEN (Head(<<3, 1, 2>>) % Head(<<>>)) ELSE IF ({1, 2} = [a |-> 1, b |-> TRUE]) THEN (-2147483647) ELSE Head(<<>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03873 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
