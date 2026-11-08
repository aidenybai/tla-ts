(*---
description: Evaluates a random set expression, seed 262, number 9774.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09774 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({[(1 :> 2) EXCEPT ![-1] = -1] : b15172 \in ({x \in 1..3 : x > 1} \cup 2..1)}) .. IF (\E b15173 \in {<<1>> : b15174 \in {}} : (\A b15175 \in Nat : TRUE)) THEN CASE (-1 \in 1..3) -> CASE FALSE -> 1 [] OTHER -> 1 [] OTHER -> Len(<<1, 2>>) ELSE Cardinality((Nat \ 2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 32 to line 14, col 37 of module random_09774
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09774 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
