(*---
description: Evaluates a random seq expression, seed 262, number 974.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00974 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(IF (Cardinality({1}) = ([a |-> 1]).a) THEN (-[a |-> 2, b |-> FALSE]) ELSE Cardinality((1 .. 3)), CASE (({x \in 1..3 : x > 1} \cap Nat) = {b1568 \in SUBSET {1} : FALSE}) -> CASE (-1 < 1) -> CASE <<5, 6>> -> 2 [] OTHER -> -1 [] OTHER -> Len(<<>>) [] OTHER -> ((3 :> 2147483647))[(CHOOSE b1569 \in SUBSET {1} : b1569)], ((-([a |-> 1]).a) * IF (~<<3, 1, 2>>) THEN ((1 :> 2))[2147483647] ELSE Cardinality(FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00974 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
