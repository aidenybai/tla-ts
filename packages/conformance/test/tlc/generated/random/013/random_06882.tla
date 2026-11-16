(*---
description: Evaluates a random bool expression, seed 262, number 6882.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06882 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b10551 == IF (\E b10552 \in {1, 2} : TRUE) THEN (-7) ELSE (3 \div -1) IN ((b10551 \div 0) * Cardinality(SUBSET {1})) = (((3 - 2147483647) - (2 + 2147483647)) + Len((<<>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 82 to line 14, col 85 of module random_06882 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 80.
    | Expression starting at line 14, column 80.
    | ExtendableExpr starting at line 14, column 79.
    | Expression starting at line 14, column 79.
    | IF THEN ELSE starting at line 14, column 31.
    | Fatal errors while parsing TLA+ spec in file random_06882
    | In module random_06882
    | Could not parse module random_06882 from file random_06882.tla
    | *** Errors: 1
    | In module random_06882
    | Could not parse module random_06882 from file random_06882.tla
    3002:1 Parsing or semantic analysis failed.
---*)
