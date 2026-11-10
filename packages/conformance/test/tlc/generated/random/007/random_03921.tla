(*---
description: Evaluates a random set expression, seed 262, number 3921.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03921 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({-1, 3} \cup {-1, [a |-> 1]}) \cap {IF FALSE THEN 3 ELSE -1 : b6186 \in (<<1, 2>> \cup Nat)}) \cap UNION {(Head(<<1, 2>>) .. (-2147483647)), Append(Append(<<1, 2>>, 1), (CHOOSE b6187 \in {2, 1, 3} : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03921 failed.
    Attempted to compare record:
    [a |-> 1]
    with non-record
    -1
---*)
