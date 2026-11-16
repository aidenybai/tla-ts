(*---
description: Evaluates a random seq expression, seed 262, number 3365.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03365 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SelectSeq(Append(<<3, 1, 2>>, 1), LAMBDA e : e > 0), Cardinality(UNION {{1}, {x \in 1..3 : x > 1}}), (CASE FALSE -> 3 [] OTHER -> 2147483647 % Head(<<3, 1, 2>>))), Cardinality({b5343 \in {b5344 : b5344 \in Nat} : (<<1, 2>> = <<5, 6>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03365 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 236 to line 14, col 238 of module random_03365
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
