(*---
description: Evaluates a random seq expression, seed 262, number 6602.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06602 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b10129 == ((0 - 3) - ([x \in Nat |-> x + 1])[2147483647]) IN <<SelectSeq(<<1>>, LAMBDA e : e > 0), (-3)>>, (((3 + -1) + (-2)) * LET b10130 == (CHOOSE b10131 \in 2..1 : TRUE) IN Cardinality(SUBSET {1}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06602 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 0 with non-integer:
    <<<<1>>, -3>>
---*)
