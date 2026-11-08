(*---
description: Evaluates a random function expression, seed 262, number 2868.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02868 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[([b4543 \in Nat |-> Nat] @@ (-1 :> 3)) EXCEPT ![Head(Tail(<<3, 1, 2>>))] = ((FALSE * 3) + (1 \div 1))] EXCEPT ![CASE ((<<1>> = <<5, 6>>) /\ (1 \in 1..3)) -> (CASE FALSE -> 1 [] OTHER -> 1 * IF TRUE THEN 2147483647 ELSE 3) [] OTHER -> (CHOOSE b4544 \in {2147483647, 0} : (FALSE <=> FALSE))] = Head([[<<3, 1, 2>> EXCEPT ![1] = 7] EXCEPT ![1] = LET b4545 == 3 IN [x \in 1..2 |-> x]])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02868 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
