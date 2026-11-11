(*---
description: Evaluates a random function expression, seed 262, number 5447.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05447 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b8435 \in UNION {(Nat \cap {}), (0 .. 1)} |-> LET b8436 == (b8435 % b8435) IN Len(<<>>)] @@ [b8437 \in (CASE TRUE -> 2147483647 [] OTHER -> 7 .. (2147483647 % 2)) |-> Cardinality({0, 1})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05447 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the integer 2147483647.
---*)
