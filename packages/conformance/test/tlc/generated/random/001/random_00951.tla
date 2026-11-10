(*---
description: Evaluates a random function expression, seed 262, number 951.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00951 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((Tail(<<1>>) \o SubSeq(<<1, 2>>, 2147483647, 7)) = ([<<1>> EXCEPT ![1] = -1] @@ ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))) THEN LET b1529 == ([b1530 \in SUBSET {1} |-> b1530])[((1 :> 2))[2]] IN Cardinality(DOMAIN (1 :> 2)) ELSE SelectSeq(Tail((CHOOSE r \in [a : 1..2] : TRUE)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00951 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
