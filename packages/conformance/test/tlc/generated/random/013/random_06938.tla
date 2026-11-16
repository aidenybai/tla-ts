(*---
description: Evaluates a random set expression, seed 262, number 6938.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06938 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((2..1 \ {}) \ (Nat \cap SUBSET {1})) \cap (DOMAIN (1 :> 2) \cap (1..3 \cap {2, 1, 3}))), {Cardinality((-1 .. 2147483647)), ((CHOOSE b10620 \in {1} : TRUE) - (1 \div 0))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06938 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)
