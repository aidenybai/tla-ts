(*---
description: Evaluates a random int expression, seed 262, number 8503.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08503 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b13171 == (-Cardinality({1, 2})) IN CASE (\E b13172 \in Nat : TRUE) -> Len(<<1>>) [] OTHER -> (1..3 \cap {1}) - (Head([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]) + ([a |-> (1 :> 2), b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08503 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 77 to line 14, col 79 of module random_08503
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
