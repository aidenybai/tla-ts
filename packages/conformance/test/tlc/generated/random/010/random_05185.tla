(*---
description: Evaluates a random set expression, seed 262, number 5185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(Len(SubSeq(<<1>>, 7, 0)) .. CASE (\A b8043 \in SUBSET {1} : TRUE) -> (7 - 0) [] OTHER -> (1 - -1)), (CASE (FALSE => TRUE) -> (0 - <<5, 6>>) [] OTHER -> CASE FALSE -> 0 [] OTHER -> 3 .. Cardinality(({2, 1, 3} \cap Nat)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05185 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
