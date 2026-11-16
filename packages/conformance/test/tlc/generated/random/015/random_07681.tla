(*---
description: Evaluates a random function expression, seed 262, number 7681.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07681 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11825 \in UNION {({2147483647, 2147483647} \cup {7 : b11826 \in Nat}), (([a |-> 1, b |-> TRUE]).a .. (2147483647 + 2))} |-> (IF ([a |-> 1, b |-> TRUE] \subseteq {2, 1, 3}) THEN Cardinality({1}) ELSE ((1 :> 2))[b11825] \div Head(SubSeq(<<1>>, b11825, b11825)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07681 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 82 to line 14, col 84 of module random_07681
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
