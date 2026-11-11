(*---
description: Evaluates a random record expression, seed 262, number 196.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00196 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ (1 :> -1)))[Append(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), CASE FALSE -> 1 [] OTHER -> 0)], b |-> (LET b322 == LET b323 == 7 IN -1 IN Len(<<3, 1, 2>>) = ((7 % 7) - (CHOOSE b324 \in {1, 2} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00196 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
