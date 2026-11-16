(*---
description: Evaluates a random bool expression, seed 262, number 3396.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03396 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Head(<<7, 0>>), Cardinality(UNION {FALSE, SUBSET {1}})) = ((IF TRUE THEN 1 ELSE 3 :> (7 * 7)) @@ [(3 :> 7) EXCEPT ![CASE FALSE -> <<3, 1, 2>> [] OTHER -> 3] = ((1 :> 2))[(1 :> 2)]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03396 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {{}, {1}} with the value:
    FALSE
---*)
