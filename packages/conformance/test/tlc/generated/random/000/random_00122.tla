(*---
description: Evaluates a random record expression, seed 262, number 122.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00122 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(UNION {{b188 : b188 \in {2, 1, 3}}, DOMAIN [x \in Nat |-> x + 1]} \cup ((1..3 \ {x \in 1..3 : x > 1}) \cup ({2, 1, 3} \cap SUBSET {1}))) EXCEPT ![1] = (((0 % -1) :> SortSeq(<<1>>, LAMBDA p, q : p < q)))[(CHOOSE b189 \in {<<3, 1, 2>> : b190 \in {2, 1, 3}} : (b189 < -1))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00122 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
