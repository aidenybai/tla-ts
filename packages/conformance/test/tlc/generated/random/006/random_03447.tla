(*---
description: Evaluates a random record expression, seed 262, number 3447.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03447 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (IF FALSE THEN -1 ELSE <<3, 1, 2>> \div Cardinality({1, 2})), b |-> ((CHOOSE b5463 \in Nat : FALSE) \/ [b5464 \in {} |-> 2147483647])] EXCEPT !.a = (((3 :> 7) @@ (1 :> 7)))[((\A b5465 \in {1} : TRUE) * (CHOOSE r \in [a : {0} \cup {1}] : TRUE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03447 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
