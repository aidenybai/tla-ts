(*---
description: Evaluates a random set expression, seed 262, number 3702.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03702 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b5847 == [[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + <<7, 2147483647>>] IN ((b5847 \div <<>>) * (CHOOSE b5848 \in {x \in 1..3 : x > 1} : FALSE)), ((CHOOSE b5849 \in ({1} \cap SUBSET {1}) : (FALSE /\ FALSE)) \div (-IF FALSE THEN 3 ELSE 2147483647))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03702 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
