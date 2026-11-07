(*---
description: Evaluates a random function expression, seed 262, number 2736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4319 \in (((7 % [x \in 1..2 |-> x]) \ ({2, 1, 3} \cap {})) \cup UNION {({} \ Nat), ((1 :> 2) @@ (1 :> 2))}) |-> Len(Append(Append(<<1, 2>>, b4319), Cardinality(Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
