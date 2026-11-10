(*---
description: Evaluates a random seq expression, seed 262, number 5418.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05418 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(<<(-0), (3 % [a |-> 1, b |-> TRUE])>>, (-Len(<<3, 1, 2>>)), IF (TRUE => TRUE) THEN Head(<<1>>) ELSE (7 + 2)), CASE (({1} = {1, 2}) <=> (TRUE <=> TRUE)) -> ((CHOOSE b8393 \in Nat : FALSE) \div [<<5, 6>> EXCEPT ![2147483647] = 3]) [] OTHER -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05418 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
