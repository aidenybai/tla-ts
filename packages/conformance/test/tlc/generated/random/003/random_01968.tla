(*---
description: Evaluates a random function expression, seed 262, number 1968.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01968 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[([(1 :> 2) EXCEPT ![3] = 2147483647] @@ ((1 :> 2) @@ [x \in Nat |-> x + 1])) EXCEPT ![CASE (\A b3113 \in 1..3 : FALSE) -> (3 - -1) [] OTHER -> (2 % 3)] = IF (3 = 7) THEN (-0) ELSE LET b3114 == 7 IN b3114] EXCEPT ![((-LET b3115 == 2147483647 IN b3115) % ((-[a |-> 1]) \div ([x \in 1..2 |-> x]).a))] = (-(CHOOSE b3116 \in {0 : b3117 \in {2, 1, 3}} : (b3116 < b3116)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 21 to line 14, col 26 of module random_01968
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01968 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
