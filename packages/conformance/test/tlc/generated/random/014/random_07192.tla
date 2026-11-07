(*---
description: Evaluates a random int expression, seed 262, number 7192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(<<5, 6>> @@ (1 :> 2)) EXCEPT ![Len(<<1>>)] = LET b11050 == 0 IN -1] @@ [b11051 \in {b11052 \in SUBSET {1} : TRUE} |-> (CHOOSE b11053 \in {1, 2} : {x \in 1..3 : x > 1})]))[(Cardinality({-1, 0}) - Head(SubSeq(<<1>>, 0, 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 139 to line 14, col 185 of module random_07192
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 139 to line 14, col 185 of module random_07192
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 139 to line 14, col 185 of module random_07192
---*)
