(*---
description: Evaluates a random record expression, seed 262, number 5564.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05564 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((CHOOSE r \in [a : {1}] : TRUE)).a, b |-> (~(FALSE => FALSE))] EXCEPT !.a = @ + CASE (~(~TRUE)) -> ([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 1])[Cardinality({})] [] OTHER -> Len(Append(<<>>, 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05564 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
