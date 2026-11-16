(*---
description: Evaluates a random set expression, seed 262, number 8807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality({b13644 \in {x \in 1..3 : x > 1} : FALSE}) : b13643 \in {Cardinality(SUBSET {1}) : b13645 \in ({x \in 1..3 : x > 1} \cap Nat)}} \cup UNION {{(-b13646) : b13646 \in (2..1 \cap SUBSET {1})}, ((CHOOSE r \in [a : 1..2] : TRUE) = (CHOOSE r \in [a : {0} \cup {1}] : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08807 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare boolean FALSE with non-boolean:
    {}
---*)
