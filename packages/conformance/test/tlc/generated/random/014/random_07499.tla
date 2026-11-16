(*---
description: Evaluates a random seq expression, seed 262, number 7499.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07499 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Append(<<1>>, [a |-> 1])) % ({3 : b11553 \in Nat})[LET b11554 == 7 IN 3]) + (CHOOSE b11555 \in {Len(<<1, 2>>) : b11556 \in (3 .. 1)} : ((TRUE => FALSE) <=> (FALSE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07499 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 67 to line 14, col 69 of module random_07499
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
