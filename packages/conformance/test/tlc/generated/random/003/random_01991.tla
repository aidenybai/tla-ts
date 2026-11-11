(*---
description: Evaluates a random function expression, seed 262, number 1991.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01991 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(FALSE => FALSE)) :> (CHOOSE f \in [{} -> 2..1] : TRUE)) @@ [Append(Append(<<3, 1, 2>>, 1), (0 + 7)) EXCEPT ![IF (0 < 7) THEN CASE TRUE -> <<3, 1, 2>> [] OTHER -> 2147483647 ELSE (0 - <<1, 2>>)] = ((3 :> 0))[Len(<<>>)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01991 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
