(*---
description: Evaluates a random seq expression, seed 262, number 6959.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06959 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(<<Cardinality(UNION {{}, 3}), IF (<<3, 1, 2>> = 2) THEN (-1 \div 7) ELSE ([x \in Nat |-> x + 1] % 1)>>, (((2 - {1}) + (<<5, 6>>)[2]) - Cardinality((1..3 \cup {2, 1, 3}))), (((<<5, 6>> @@ <<5, 6>>) @@ (2147483647 :> 2)) - (CHOOSE b10648 \in ({1, 2} \cap {1, 2}) : (<<3, 1, 2>> = <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06959 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 3 with non-integer:
    {}
---*)
