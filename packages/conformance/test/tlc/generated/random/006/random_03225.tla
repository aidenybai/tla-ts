(*---
description: Evaluates a random function expression, seed 262, number 3225.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03225 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((1 \div 2) % [<<1, 2>> EXCEPT ![1] = -1]) :> LET b5124 == LET b5125 == [a |-> 1] IN 3 IN (TRUE).a) EXCEPT ![(((\E b5126 \in Nat : TRUE) /\ (\A b5127 \in Nat : <<1, 2>>)) \/ ({2147483647, 0} \subseteq {2, 7}))] = Len(SubSeq((<<5, 6>>)[3], (2 :> [x \in Nat |-> x + 1]), CASE FALSE -> -1 [] OTHER -> Nat))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03225 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
