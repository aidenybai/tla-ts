(*---
description: Evaluates a random set expression, seed 262, number 9182.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09182 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality(((<<>> \ {1}) \cup DOMAIN (1 :> 2))), ((-IF [x \in Nat |-> x + 1] THEN 7 ELSE 3) * ((0 \div 7) * (7 - 7)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09182 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<>>
    is not enumerable.
---*)
