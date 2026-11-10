(*---
description: Evaluates a random bool expression, seed 262, number 8079.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08079 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b12487 \in ((1..3 \cup {1, 2}) \cup (Nat \cup {1, 2})) : (\A b12488 \in DOMAIN (1 :> 2) : (3 = 0))) <=> (((CHOOSE r \in [a : 2..1] : TRUE) \div (Nat % -1)) = Cardinality(Len(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08079 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    Nat
    are not both enumerable
---*)
