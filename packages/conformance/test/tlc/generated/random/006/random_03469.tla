(*---
description: Evaluates a random set expression, seed 262, number 3469.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03469 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([b5485 \in DOMAIN (1 :> 2) |-> (1 % b5484)])[LET b5486 == CASE <<5, 6>> -> 3 [] OTHER -> 1 IN (b5486 \div b5486)] : b5484 \in (Head(<<7, {x \in 1..3 : x > 1}>>) .. ((2 :> 1) \div (CHOOSE b5487 \in SUBSET {1} : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03469 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
