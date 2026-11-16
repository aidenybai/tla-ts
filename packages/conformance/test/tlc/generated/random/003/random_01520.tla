(*---
description: Evaluates a random seq expression, seed 262, number 1520.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01520 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([<<LET b2420 == [x \in 1..2 |-> x] IN 2, IF FALSE THEN 3 ELSE 2>> EXCEPT ![1] = (UNION {SUBSET {1}, {2, 1, 3}} - Len(<<1>>))], ((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE))[((7 % 2147483647) \div {-1, {}})]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 104 to line 14, col 108 of module random_01520 and -.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 110.
    | Expression starting at line 14, column 104.
    | ExtendableExpr starting at line 14, column 103.
    | Expression starting at line 14, column 103.
    | Except Spec starting at line 14, column 96.
    | Fatal errors while parsing TLA+ spec in file random_01520
    | In module random_01520
    | Could not parse module random_01520 from file random_01520.tla
    | *** Errors: 1
    | In module random_01520
    | Could not parse module random_01520 from file random_01520.tla
    3002:1 Parsing or semantic analysis failed.
---*)
