(*---
description: Evaluates a random record expression, seed 262, number 7862.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07862 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b12144 \in UNION {1..3, {}} : (SUBSET {1} \subseteq {1})), b |-> (\E b12145 \in (1..3 \cap SUBSET {1}) : ({} \subseteq Nat))] EXCEPT !.a = Len([SubSeq(<<1, 2>>, 1, 0) EXCEPT ![1] = Cardinality(SUBSET {1})])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07862 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
