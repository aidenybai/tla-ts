(*---
description: Evaluates a random set expression, seed 262, number 9590.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09590 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ({b14890 \in 1..3 : TRUE} = ({1} \cup {})) THEN {(0 % 3) : b14891 \in DOMAIN [x \in Nat |-> x + 1]} ELSE (CASE FALSE -> -1 [] OTHER -> 3 * IF TRUE THEN <<3, 1, 2>> ELSE 7) .. (((0 * <<3, 1, 2>>) - (CHOOSE b14892 \in SUBSET {1} : FALSE)) \div ((CHOOSE b14893 \in 1..3 : <<3, 1, 2>>) + CASE TRUE -> 3 [] OTHER -> 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09590 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
