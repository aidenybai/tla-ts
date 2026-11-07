(*---
description: Evaluates a random function expression, seed 262, number 7236.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07236 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<5, 6>> EXCEPT ![7] = 2] @@ [b11117 \in SUBSET {1} |-> b11117]))[(SelectSeq(<<>>, LAMBDA e : e > 0) + CASE FALSE -> -1 [] OTHER -> 2147483647)] :> (CASE [[a |-> 1] EXCEPT !.a = @ + 3] -> LET b11118 == 7 IN 7 [] OTHER -> (2 - 2) \div (CHOOSE b11119 \in {b11120 \in {1, 2} : {2, 1, 3}} : ([a |-> 1] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 27 of module random_07236
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of the set {} with the value:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of the set {} with the value:
    1
---*)
