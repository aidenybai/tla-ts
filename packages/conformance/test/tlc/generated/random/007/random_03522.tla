(*---
description: Evaluates a random function expression, seed 262, number 3522.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03522 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([b5563 \in {b5564 : b5564 \in {1, 2}} |-> (b5563 % <<3, 1, 2>>)] @@ [(<<5, 6>> @@ (1 :> 2)) EXCEPT ![IF FALSE THEN 2 ELSE 7] = (1 * [a |-> 1, b |-> TRUE])]) EXCEPT ![Head(SelectSeq(SubSeq(<<1, 2>>, 1, 3), LAMBDA e : e > 0))] = (((1 - 2147483647) :> LET b5565 == 2147483647 IN b5565) \subseteq (IF FALSE THEN 7 ELSE 1 \cup ({x \in 1..3 : x > 1} \cap Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03522 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
