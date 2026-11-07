(*---
description: Evaluates a random record expression, seed 262, number 6493.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06493 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(LET b9983 == Head(<<1>>) IN CASE FALSE -> b9983 [] OTHER -> -1 \in ({7 : b9984 \in Nat} \cup {b9985 : b9985 \in SUBSET {1}})) EXCEPT !.a = @ + LET b9986 == ((-1 :> FALSE))[Cardinality({1})] IN Cardinality(UNION {Nat, {1}})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06493 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 101 to line 14, col 103 of module random_06493
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
