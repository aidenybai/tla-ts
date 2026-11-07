(*---
description: Evaluates a random function expression, seed 262, number 5759.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05759 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(IF TRUE THEN -1 ELSE 2147483647 :> LET b8863 == -1 IN b8863) EXCEPT ![(CASE FALSE -> 1 [] OTHER -> 2147483647 - ([x \in 1..2 |-> x] \div <<5, 6>>))] = CASE (<<>> = <<5, 6>>) -> LET b8864 == 1 IN b8864 [] OTHER -> CASE TRUE -> [x \in Nat |-> x + 1] [] OTHER -> 2147483647] @@ [([b8865 \in {x \in 1..3 : x > 1} |-> b8865] @@ (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE)) EXCEPT ![(-([x \in 1..2 |-> x])[1])] = Cardinality(({} \ {}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
