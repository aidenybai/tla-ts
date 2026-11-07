(*---
description: Evaluates a random bool expression, seed 262, number 3443.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03443 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b5457 \in ({b5458 : b5458 \in <<1>>} \cup DOMAIN (1 :> 2)) : ({b5459 \in Nat : [a |-> 1]} = ({} \cap {1, 2}))) < Len([(<<3, 1, 2>> \o <<3, 1, 2>>) EXCEPT ![1] = (<<5, 6>>)[1]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03443 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1>>.
    line 14, col 55 to line 14, col 59 of module random_03443
---*)
