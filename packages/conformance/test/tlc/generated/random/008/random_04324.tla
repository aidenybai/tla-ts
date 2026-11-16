(*---
description: Evaluates a random set expression, seed 262, number 4324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = @ + 2]).a .. CASE (Nat = {1}) -> (2147483647 - <<1>>) [] OTHER -> (2147483647 + 3)) \cap {([[a |-> 1] EXCEPT !.a = @ + 3]).a, ((-7) + (7 * 1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04324 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
---*)
