(*---
description: Evaluates a random function expression, seed 262, number 7844.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07844 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12118 \in UNION {DOMAIN [b12119 \in 2..1 |-> 3], ((-1 .. 3) \cup ({1} \cup {2, 1, 3}))} |-> [((CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE) @@ ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])) EXCEPT ![CASE (TRUE \/ 2147483647) -> LET b12120 == -1 IN [a |-> 1] [] OTHER -> IF TRUE THEN b12118 ELSE b12118] = Len(Tail(<<3, 1, 2>>))]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b12118 \\in {-1, 0, 1, 2, 3} |-> <expression line 14, col 110 to line 14, col 343 of module random_07844>]"
---*)
