(*---
description: Evaluates a random seq expression, seed 262, number 8506.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08506 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([<<(CHOOSE b13175 \in {x \in 1..3 : x > 1} : TRUE), IF TRUE THEN 2 ELSE 2147483647>> EXCEPT ![1] = ((2147483647 < 7) \/ (1..3 \subseteq SUBSET {1}))] \o (((7 :> -1) @@ (Nat :> 0)) \o SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08506 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
