(*---
description: Evaluates a random set expression, seed 262, number 9979.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09979 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF ((-1 \ {1, 2}) \subseteq ({} \cap 1..3)) THEN ((CHOOSE r \in [a : 2..1] : TRUE)).a ELSE (-(2 \div 0)), CASE ((FALSE /\ FALSE) /\ (<<1>> = (1 :> 2))) -> ((-3) - Cardinality({x \in 1..3 : x > 1})) [] OTHER -> Cardinality(({1, 2} \cup {1}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09979 failed.
    Attempted to enumerate S \ T when S:
    -1
    is not enumerable.
---*)
