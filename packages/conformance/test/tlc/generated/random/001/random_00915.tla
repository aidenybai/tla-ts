(*---
description: Evaluates a random function expression, seed 262, number 915.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00915 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Tail(Append(<<3, 1, 2>>, 2147483647))) :> (CHOOSE b1474 \in UNION {(0 .. 1), (<<>> \cup SUBSET {1})} : (([a |-> 1] = [a |-> 1]) <=> (1..3 \subseteq {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00915 failed.
    Attempted to enumerate S \cup T when S:
    <<>>
    and T:
    {{}, {1}}
    are not both enumerable
---*)
