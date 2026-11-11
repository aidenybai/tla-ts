(*---
description: Evaluates a random set expression, seed 262, number 2058.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN (CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE) \cup {Len(<<1, 2>>), (2 \div 2)}) \cup ((UNION {{1}, {}} \cap (Nat \cap {})) \ (({x \in 1..3 : x > 1} * -1) .. (0 \div 0)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 168 to line 14, col 168 of module random_02058 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 147.
    | Expression starting at line 14, column 147.
    | ExtendableExpr starting at line 14, column 146.
    | Expression starting at line 14, column 146.
    | ExtendableExpr starting at line 14, column 145.
    | Fatal errors while parsing TLA+ spec in file random_02058
    | In module random_02058
    | Could not parse module random_02058 from file random_02058.tla
    | *** Errors: 1
    | In module random_02058
    | Could not parse module random_02058 from file random_02058.tla
    3002:1 Parsing or semantic analysis failed.
---*)
