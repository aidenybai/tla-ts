(*---
description: Evaluates a random function expression, seed 262, number 5403.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05403 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((([a |-> 1]).a :> LET b8364 == 2147483647 IN b8364) @@ [b8365 \in DOMAIN [x \in Nat |-> x + 1] |-> (CHOOSE b8366 \in 1..3 : FALSE)]) EXCEPT ![IF (({x \in 1..3 : x > 1} \subseteq SUBSET {1}) \/ (\A b8367 \in 2..1 : TRUE)) THEN Head(Tail(<<1, 2>>)) ELSE (Len(<<3, 1, 2>>) - (-2))] = ([SubSeq(<<1>>, 3, 7) EXCEPT ![1] = CASE FALSE -> 1 [] OTHER -> 0] \o SelectSeq([<<1, 2>> EXCEPT ![1] = 3], LAMBDA e : e > 0))])
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
