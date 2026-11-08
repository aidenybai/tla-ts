(*---
description: Evaluates a random seq expression, seed 262, number 9644.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09644 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SelectSeq(<<3, 3>>, LAMBDA e : e > 0) EXCEPT ![1] = LET b14973 == (-1 + 7) IN Len(<<1>>)], Cardinality(DOMAIN ((1 :> 2) @@ [x \in Nat |-> x + 1])), ([[[a |-> 1] EXCEPT !.a = 0] EXCEPT !.a = @ + Cardinality(2..1)] \div (CHOOSE b14974 \in {b14975 \in 2..1 : FALSE} : (\A b14976 \in {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09644 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
