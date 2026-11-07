(*---
description: Evaluates a random function expression, seed 262, number 2680.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02680 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[([[x \in Nat |-> x + 1] EXCEPT ![2] = 2] @@ (-1 :> 1)) EXCEPT ![Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))] = Cardinality(({2, 1, 3} \cup 1..3))] EXCEPT ![(CHOOSE b4236 \in [(<<5, 6>> @@ <<5, 6>>) EXCEPT ![Head(<<>>)] = (CHOOSE b4237 \in 2..1 : TRUE)] : (Tail(<<1>>) = (b4236 @@ (1 :> 2))))] = IF ((FALSE \/ TRUE) <=> (7 \/ <<3, 1, 2>>)) THEN Head(SubSeq(<<1, 2>>, 0, 0)) ELSE (([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))[CASE [x \in 1..2 |-> x] -> 2 [] OTHER -> -1]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
