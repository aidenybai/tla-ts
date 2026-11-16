(*---
description: Evaluates a random bool expression, seed 262, number 6927.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06927 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b10605 \in DOMAIN [b10606 \in DOMAIN [x \in Nat |-> x + 1] |-> Len(<<>>)] : (UNION {({x \in 1..3 : x > 1} \cup <<1, 2>>), (2147483647 .. -1)} = {(3 % -1), (3 - b10605)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06927 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 31 to line 14, col 92 of module random_06927
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
