(*---
description: Evaluates a random set expression, seed 262, number 4918.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04918 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7650 \in {IF ([a |-> 1, b |-> TRUE] \subseteq {1, 2}) THEN (b7651 + 2147483647) ELSE (-b7651) : b7651 \in (({x \in 1..3 : x > 1} \ 1..3) \cup DOMAIN [x \in Nat |-> x + 1])} : ((Append(<<1, 2>>, -1) \o SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) = [[b7652 \in FALSE |-> -1] EXCEPT ![(b7650 * b7650)] = [b7653 \in {1, 2} |-> b7650]])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04918 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 125 to line 14, col 187 of module random_04918
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
