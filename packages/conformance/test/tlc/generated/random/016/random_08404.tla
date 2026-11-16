(*---
description: Evaluates a random function expression, seed 262, number 8404.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08404 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b13007 \in ({1, 2} \cup SUBSET {1}) |-> ([a |-> 1, b |-> TRUE]).a] EXCEPT ![([b13008 \in {x \in 1..3 : x > 1} |-> 2])[Head(<<3, 1, 2>>)]] = Len(SortSeq(<<>>, LAMBDA p, q : p < q))] @@ (([b13009 \in Nat |-> b13009] @@ (2 :> 2147483647)) @@ [[b13010 \in {1} |-> b13010] EXCEPT ![CASE FALSE -> 3 [] OTHER -> 2] = (CHOOSE b13011 \in {2, 1, 3} : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08404 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
