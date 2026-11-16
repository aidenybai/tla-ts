(*---
description: Evaluates a random int expression, seed 262, number 2786.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02786 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (-[x \in 1..2 |-> x]), b |-> (1 < 1)] :> (LET b4404 == -1 IN TRUE + ([a |-> 1]).a)))[(CHOOSE b4405 \in {(CHOOSE b4407 \in {1, 2} : TRUE) : b4406 \in UNION {{x \in 1..3 : x > 1}, Nat}} : ((b4405 \div b4405) < ([x \in Nat |-> x + 1])[b4405]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02786 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
