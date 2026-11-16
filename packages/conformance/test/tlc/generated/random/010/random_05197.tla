(*---
description: Evaluates a random int expression, seed 262, number 5197.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05197 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (Len(<<1>>) = LET b8060 == 0 IN 3) THEN ((0 + 7) + (2147483647 % 0)) ELSE (({x \in 1..3 : x > 1})[-1] % (3 * -1)) % Head(<<(0 % 2147483647), (CHOOSE b8061 \in {} : FALSE)>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 127 to line 14, col 127 of module random_05197 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 125.
    | ExtendableExpr starting at line 14, column 124.
    | ExtendableExpr starting at line 14, column 95.
    | Expression starting at line 14, column 95.
    | Fatal errors while parsing TLA+ spec in file random_05197
    | In module random_05197
    | Could not parse module random_05197 from file random_05197.tla
    | *** Errors: 1
    | In module random_05197
    | Could not parse module random_05197 from file random_05197.tla
    3002:1 Parsing or semantic analysis failed.
---*)
