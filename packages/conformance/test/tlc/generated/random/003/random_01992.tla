(*---
description: Evaluates a random int expression, seed 262, number 1992.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01992 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b3155 \in UNION {{b3156 \in DOMAIN (1 :> 2) : (b3156 = -1)}, DOMAIN (1 :> 1)} : (IF (FALSE <=> FALSE) THEN (b3155 + b3155) ELSE (2 - 3) = ((1 % 2147483647) + (b3155 \div -1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 189 to line 14, col 192 of module random_01992 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 183.
    | Expression starting at line 14, column 183.
    | ExtendableExpr starting at line 14, column 182.
    | ExtendableExpr starting at line 14, column 163.
    | Expression starting at line 14, column 163.
    | Fatal errors while parsing TLA+ spec in file random_01992
    | In module random_01992
    | Could not parse module random_01992 from file random_01992.tla
    | *** Errors: 1
    | In module random_01992
    | Could not parse module random_01992 from file random_01992.tla
    3002:1 Parsing or semantic analysis failed.
---*)
