(*---
description: Evaluates a random int expression, seed 262, number 6562.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06562 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((-1) = (-1 * <<1>>)) -> (({2, 1, 3})[7] % LET b10084 == 3 IN -1) [] OTHER -> Cardinality(({1, 2} \cap Nat)) * ((LET b10085 == 2147483647 IN 2 - Cardinality(Nat)) - (CHOOSE b10086 \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] : (FALSE <=> FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06562 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
