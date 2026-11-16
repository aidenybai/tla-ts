(*---
description: Evaluates a random bool expression, seed 262, number 7408.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07408 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN ([x \in 1..2 |-> x] @@ <<5, 6>>) \cup ((2..1 \cup 1..3) \cap {b11411 \in {x \in 1..3 : x > 1} : FALSE})) \subseteq UNION {({b11412 : b11412 \in Nat} \cup (2147483647 < 0)), ({b11413 : b11413 \in [a |-> 1]} \cap {b11414 : b11414 \in {x \in 1..3 : x > 1}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07408 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 169 to line 14, col 171 of module random_07408
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
