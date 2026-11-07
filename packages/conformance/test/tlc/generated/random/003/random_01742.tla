(*---
description: Evaluates a random function expression, seed 262, number 1742.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01742 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(Append([<<1>> EXCEPT ![1] = 2147483647], (0 - 7)), LAMBDA p, q : p < q) = [(Cardinality(SUBSET {1}) :> (-[a |-> 1])) EXCEPT ![(CHOOSE b2767 \in ({2, 1, 3} \cup 1..3) : (TRUE /\ TRUE))] = ((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE))[IF TRUE THEN 2147483647 ELSE 3]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
