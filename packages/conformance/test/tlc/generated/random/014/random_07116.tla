(*---
description: Evaluates a random function expression, seed 262, number 7116.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07116 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((CHOOSE r \in [a : {0} \cup {1}] : TRUE) @@ [b10929 \in {1, 2} |-> b10929]) @@ ([[x \in 1..2 |-> x] EXCEPT ![-1] = 3] @@ (2147483647 :> 0))) EXCEPT ![(CASE (7 \in 2..1) -> ([x \in 1..2 |-> x])[2] [] OTHER -> (2 % -1) + ((CHOOSE b10930 \in {2, 1, 3} : TRUE) \div IF FALSE THEN 7 ELSE 1))] = Len([(CHOOSE r \in [a : {}] : TRUE) EXCEPT ![1] = ([a |-> 1])[1]])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    "a"
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
