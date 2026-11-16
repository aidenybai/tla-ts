(*---
description: Evaluates a random int expression, seed 262, number 7751.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07751 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({1}) - SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) \div (IF FALSE THEN 7 ELSE -1 * Cardinality(2..1))) % CASE ((SUBSET {1} = 2..1) => (\E b11954 \in SUBSET {1} : TRUE)) -> {(CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE), (3 % -1)} [] OTHER -> Len(SubSeq(<<1>>, 2, 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07751 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
