(*---
description: Evaluates a random seq expression, seed 262, number 7563.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07563 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {({b11642 \in 2 : FALSE} \ {2147483647 : b11643 \in Nat}), Tail(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))} \cup (UNION {DOMAIN (1 :> 2), (3 .. 1)} \ {Append(<<1>>, b11644) : b11644 \in ((1 :> 2) @@ <<5, 6>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07563 failed.
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 14, col 75 to line 14, col 77 of module random_07563
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
