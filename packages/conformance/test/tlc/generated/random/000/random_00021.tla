(*---
description: Evaluates a random seq expression, seed 262, number 21.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00021 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([SelectSeq((<<1>> \o <<1, 2>>), LAMBDA e : e > 0) EXCEPT ![1] = Cardinality(({1, 2} \ {}))], (([(1 :> 2) EXCEPT ![3] = 2147483647] @@ [b27 \in 0 |-> 3]))[(CHOOSE b28 \in (2147483647 .. 7) : (<<1, 2>> = [x \in 1..2 |-> x]))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 120 to line 14, col 125 of module random_00021
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00021 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the integer 0.
---*)
