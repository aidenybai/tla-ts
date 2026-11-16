(*---
description: Evaluates a random seq expression, seed 262, number 9732.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09732 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) % (LET b15106 == 7 IN 7 + (2 \div -1))), Head(Tail(Append(<<1>>, -1)))>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 92 to line 14, col 95 of module random_09732 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 90.
    | Expression starting at line 14, column 90.
    | ExtendableExpr starting at line 14, column 89.
    | ExtendableExpr starting at line 14, column 85.
    | Expression starting at line 14, column 85.
    | Fatal errors while parsing TLA+ spec in file random_09732
    | In module random_09732
    | Could not parse module random_09732 from file random_09732.tla
    | *** Errors: 1
    | In module random_09732
    | Could not parse module random_09732 from file random_09732.tla
    3002:1 Parsing or semantic analysis failed.
---*)
