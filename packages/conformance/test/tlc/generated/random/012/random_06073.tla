(*---
description: Evaluates a random bool expression, seed 262, number 6073.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b9354 \in ({([a |-> 1, b |-> TRUE]).a : b9355 \in ({2, 1, 3} \cup 1..3)} \cap ({b9356 : b9356 \in {}} \cup {1 : b9357 \in Nat})) : (Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) = (CHOOSE b9358 \in DOMAIN [x \in Nat |-> x + 1] : (FALSE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06073 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 142 to line 14, col 144 of module random_06073
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
