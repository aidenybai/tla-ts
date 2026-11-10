(*---
description: Evaluates a random record expression, seed 262, number 9842.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09842 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality({b15282 : b15282 \in 2}), b |-> ((2..1 = <<>>) /\ (2..1 \subseteq {1, 2}))] EXCEPT !.a = @ + ((Len(<<1>>) * (0 - 3)) % (<<2, -1>>).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09842 failed.
    TLC encountered a non-enumerable quantifier bound
    2.
    2
---*)
