(*---
description: Evaluates a random bool expression, seed 262, number 7706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ({1} \subseteq {2, 1, 3}) -> IF FALSE THEN 1 ELSE 3 [] OTHER -> (CHOOSE b11883 \in {x \in 1..3 : x > 1} : TRUE) + (CHOOSE b11884 \in (1..3 \cap {1}) : (<<>> = [x \in Nat |-> x + 1]))) < Len(((<<5, 6>> @@ [x \in Nat |-> x + 1]) @@ (<<1, 2>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07706 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
