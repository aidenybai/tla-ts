(*---
description: Evaluates a random set expression, seed 262, number 26.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE b35 \in {3 : b36 \in <<>>} : (\A b37 \in SUBSET {1} : FALSE)) * (CHOOSE b38 \in (<<>> \cup {x \in 1..3 : x > 1}) : (b38 \in {1}))), (Cardinality(UNION {Nat, {1, 2}}) + ([<<1, 2>> EXCEPT ![1] = 2] @@ (2 :> 2147483647)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00026 failed.
    TLC encountered a non-enumerable quantifier bound
    <<>>.
    line 14, col 47 to line 14, col 50 of module random_00026
---*)
