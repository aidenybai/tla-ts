(*---
description: Evaluates a random function expression, seed 262, number 992.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00992 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq((<<1, 2>> \o <<>>), LAMBDA e : e > 0)) :> ([(CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE) EXCEPT ![(3 % <<1>>)] = Cardinality({1})])[(CHOOSE r \in [a : {}] : TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00992 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
