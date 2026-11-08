(*---
description: Evaluates a random set expression, seed 262, number 4623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(2..1 \subseteq {1, 2}) : b7237 \in {2 : b7238 \in {x \in 1..3 : x > 1}}}, UNION {({} \cup SUBSET {1}), UNION {{}, {x \in 1..3 : x > 1}}}} \cup (DOMAIN (2 :> -1) \cup (UNION {{1}, SUBSET {1}} \cup {b7239 : b7239 \in SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04623 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 2 with non-integer:
    {}
---*)
