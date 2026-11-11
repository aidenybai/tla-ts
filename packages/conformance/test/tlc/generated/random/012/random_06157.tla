(*---
description: Evaluates a random int expression, seed 262, number 6157.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06157 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b9473 == Cardinality((2 .. 2)) IN IF ({} \subseteq Nat) THEN SubSeq(<<1>>, b9473, 7) ELSE UNION {SUBSET {1}, {}} + (IF (3 = -1) THEN (-1 < -1) ELSE (-1) + LET b9474 == (2 \div 2147483647) IN ([x \in 1..2 |-> x])[b9474])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 111 to line 14, col 115 of module random_06157 and +.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 117.
    | Expression starting at line 14, column 111.
    | IF THEN ELSE starting at line 14, column 55.
    | Expression starting at line 14, column 55.
    | Case Other Arm starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_06157
    | In module random_06157
    | Could not parse module random_06157 from file random_06157.tla
    | *** Errors: 1
    | In module random_06157
    | Could not parse module random_06157 from file random_06157.tla
    3002:1 Parsing or semantic analysis failed.
---*)
