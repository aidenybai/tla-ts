(*---
description: Evaluates a random bool expression, seed 262, number 8984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b13946 \in {b13947 : b13947 \in Nat} : (2 < 1)} = ((2 .. 7) \ (SUBSET {1} \cap {1, 2}))) \/ ((CASE [a |-> 1, b |-> TRUE] -> 2 [] OTHER -> 2 % ([a |-> 1, b |-> TRUE]).a) \in {b13948 \in DOMAIN (1 :> 2) : (b13948 = b13948)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08984 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 51 to line 14, col 53 of module random_08984
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
