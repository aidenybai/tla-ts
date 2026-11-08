(*---
description: Evaluates a random seq expression, seed 262, number 6012.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq([Append(<<1>>, 2147483647) EXCEPT ![1] = (2147483647 + [a |-> 1, b |-> TRUE])], LET b9257 == ((1 :> 2))[0] IN (-3), Len(Tail(<<>>))), Head([[<<1>> EXCEPT ![1] = -1] EXCEPT ![1] = (CHOOSE r \in [a : {1}] : TRUE)]), (IF (2..1 = 1..3) THEN (0 * 2147483647) ELSE CASE FALSE -> 2147483647 [] OTHER -> 3 \div Cardinality((Nat \cup {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06012 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
