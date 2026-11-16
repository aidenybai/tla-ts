(*---
description: Evaluates a random bool expression, seed 262, number 8242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b12751 : b12751 \in Nat} \cap (2..1 \cup 1..3)) \cap {b12752 \in {0, 0} : (b12752 \in {x \in 1..3 : x > 1})}) \subseteq {b12753 \in DOMAIN (2 :> 7) : ((-b12753) \subseteq DOMAIN [x \in 1..2 |-> x])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08242 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 40 to line 14, col 42 of module random_08242
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
