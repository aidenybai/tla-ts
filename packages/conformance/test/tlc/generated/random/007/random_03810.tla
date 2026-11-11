(*---
description: Evaluates a random record expression, seed 262, number 3810.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03810 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (IF TRUE THEN 3 ELSE 3 - IF FALSE THEN 2147483647 ELSE 2), b |-> ((Nat = 1..3) <=> (~TRUE))] EXCEPT !.a = @ + ((~(TRUE => 2..1)) + ((0 - 2147483647) % Len(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03810 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
