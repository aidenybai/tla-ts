(*---
description: Evaluates a random function expression, seed 262, number 6615.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06615 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((-(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)) :> Head(<<2, 1>>)) EXCEPT ![CASE ((~FALSE) => (SUBSET {1} = Nat)) -> (Head([x \in Nat |-> x + 1]) * LET b10150 == 3 IN b10150) [] OTHER -> {Len(<<>>), Len(<<1>>)}] = (IF (\A b10151 \in SUBSET {1} : TRUE) THEN (CHOOSE b10152 \in {2, 1, 3} : TRUE) ELSE ([a |-> 1, b |-> TRUE]).a + Head(<<-1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06615 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
