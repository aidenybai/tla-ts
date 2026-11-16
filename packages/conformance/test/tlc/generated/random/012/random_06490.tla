(*---
description: Evaluates a random seq expression, seed 262, number 6490.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06490 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1] = [a |-> 1]) => (FALSE => TRUE)) => ((Nat \ 1..3) = {0 : b9977 \in Nat})) /\ [b9978 \in {((1 :> 2))[1] : b9979 \in (SUBSET {1} \cup {})} |-> ((b9978 - 3) * (b9978 % b9978))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06490 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 97 to line 14, col 99 of module random_06490
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
