(*---
description: Evaluates a random set expression, seed 262, number 8429.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08429 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> IF TRUE THEN 7 ELSE 1, b |-> (FALSE <=> FALSE)] EXCEPT !.a = (({1} \cup SUBSET {1}) \ ({1, 2} \ Nat))] \ (CHOOSE r \in [a : {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08429 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    [a |-> {1} \cup {{}, {1}} \ {}, b |-> TRUE]
    is not enumerable.
---*)
