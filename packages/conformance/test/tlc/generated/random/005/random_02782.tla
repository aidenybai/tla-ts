(*---
description: Evaluates a random set expression, seed 262, number 2782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b4395 \in 2..1 : FALSE} \cap (SUBSET {1} \cup 2..1)) \cap (({} \cap {x \in 1..3 : x > 1}) \subseteq UNION {{x \in 1..3 : x > 1}, {1}})) \cap {((CHOOSE r \in [a : {0} \cup {1}] : TRUE) \div (7 % 7)), (CHOOSE b4396 \in [a |-> 1, b |-> FALSE] : (FALSE = b4396))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02782 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
