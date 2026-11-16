(*---
description: Evaluates a random int expression, seed 262, number 5397.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05397 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {DOMAIN <<5, 6>>, {3, 3}} + LET b8349 == (1 * 2) IN IF TRUE THEN 3 ELSE b8349) .. ((-(1 - -1)) * CASE (SUBSET {1} \subseteq {1, 2}) -> (0 \div 2) [] OTHER -> (CHOOSE b8350 \in 2..1 : TRUE))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 18 to line 14, col 22 of module random_05397 and +.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 24.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Expression starting at line 14, column 17.
    | ExtendableExpr starting at line 14, column 16.
    | Fatal errors while parsing TLA+ spec in file random_05397
    | In module random_05397
    | Could not parse module random_05397 from file random_05397.tla
    | *** Errors: 1
    | In module random_05397
    | Could not parse module random_05397 from file random_05397.tla
    3002:1 Parsing or semantic analysis failed.
---*)
