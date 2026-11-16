(*---
description: Evaluates a random int expression, seed 262, number 3154.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03154 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([SubSeq(<<1>>, 7, 2147483647) EXCEPT ![1] = IF TRUE THEN -1 ELSE 2147483647]) % (IF (Nat = Nat) THEN IF FALSE THEN 1 ELSE 2 ELSE CASE FALSE -> 2147483647 [] OTHER -> 2 * IF (\E b5026 \in {2, 1, 3} : FALSE) THEN IF TRUE THEN 3 ELSE 0 ELSE CASE TRUE -> 2147483647 [] OTHER -> 7)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03154 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    7
---*)
