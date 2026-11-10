(*---
description: Evaluates a random record expression, seed 262, number 4455.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04455 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b7014 \in DOMAIN ([x \in 1..2 |-> x] :> -1) : ((FALSE /\ FALSE) \/ (\A b7015 \in {} : TRUE))), b |-> (((-<<>>) .. Head(<<1, 2>>)) = UNION {{b7016 \in SUBSET {1} : FALSE}, DOMAIN (1 :> 2)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04455 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
