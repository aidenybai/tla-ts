(*---
description: Evaluates a random function expression, seed 262, number 307.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00307 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b513 \in (({-1, 3} \cup UNION {SUBSET {1}, SUBSET {1}}) \cap {b514 \in (<<>> \cap Nat) : (b514 < b514)}) |-> (LET b515 == CASE FALSE -> [x \in 1..2 |-> x] [] OTHER -> b513 IN (3 + 3) % Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b513 \\in {-1, 3} \\cup {{}, {1}} \\cap {b514 \\in <<>> \\cap Nat : <expression line 14, col 107 to line 14, col 117 of module random_00307> } |-> <expression line 14, col 127 to line 14, col 245 of module random_00307>]"
---*)
