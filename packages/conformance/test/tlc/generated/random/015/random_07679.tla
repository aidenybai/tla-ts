(*---
description: Evaluates a random bool expression, seed 262, number 7679.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07679 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(DOMAIN (CHOOSE f \in [2..1 -> 1..2] : TRUE)) < Head(SubSeq([<<1>> EXCEPT ![1] = -1], (7 \div -1), (<<1, 2>> * 0)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 117 to line 14, col 120 of module random_07679 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 115.
    | Expression starting at line 14, column 115.
    | ExtendableExpr starting at line 14, column 114.
    | Expression starting at line 14, column 114.
    | Optional Arguments starting at line 14, column 87.
    | Fatal errors while parsing TLA+ spec in file random_07679
    | In module random_07679
    | Could not parse module random_07679 from file random_07679.tla
    | *** Errors: 1
    | In module random_07679
    | Could not parse module random_07679 from file random_07679.tla
    3002:1 Parsing or semantic analysis failed.
---*)
