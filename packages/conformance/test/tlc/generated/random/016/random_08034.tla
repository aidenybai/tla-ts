(*---
description: Evaluates a random function expression, seed 262, number 8034.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE] @@ (1 :> 2)))[(-1 * 0)] * ((CHOOSE b12399 \in 2..1 : TRUE) \div (3 * 1))) :> ([b12400 \in SelectSeq(<<>>, LAMBDA e : e > 0) |-> Head(<<1, 2>>)] @@ ((<<5, 6>>)[{2, 1, 3}] :> ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08034 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
