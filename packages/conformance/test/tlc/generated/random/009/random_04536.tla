(*---
description: Evaluates a random seq expression, seed 262, number 4536.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04536 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Tail((<<3, 1, 2>> \o <<1>>)), LAMBDA e : e > 0) EXCEPT ![1] = (((\E b7119 \in Nat : FALSE) \/ (~TRUE)) % (([a |-> 1, b |-> TRUE]).a % ([a |-> 1] * 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04536 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 105 to line 14, col 107 of module random_04536
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
