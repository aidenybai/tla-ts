(*---
description: Evaluates a random set expression, seed 262, number 8433.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08433 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13053 \in ((CHOOSE r \in [a : 1..2] : TRUE) \cup DOMAIN SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) : ((CHOOSE b13054 \in {b13055 \in SUBSET {1} : TRUE} : ({1} = Nat)) \in [a |-> (b13053 + 2), b |-> (<<3, 1, 2>> = [x \in 1..2 |-> x])])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08433 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    1..2
    and T:
    [a |-> 1]
    are not both enumerable
---*)
