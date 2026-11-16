(*---
description: Evaluates a random function expression, seed 262, number 7201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b11065 == (IF FALSE THEN 2 ELSE 3 - (-2)) IN Len(SubSeq(<<1>>, b11065, 2)) :> ((Len(<<1>>) * (3 \div -1)) % (Head(<<1, 2>>) % (CHOOSE b11066 \in SUBSET {1} : TRUE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 117 to line 14, col 120 of module random_07201 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 115.
    | Expression starting at line 14, column 115.
    | ExtendableExpr starting at line 14, column 114.
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 101.
    | Fatal errors while parsing TLA+ spec in file random_07201
    | In module random_07201
    | Could not parse module random_07201 from file random_07201.tla
    | *** Errors: 1
    | In module random_07201
    | Could not parse module random_07201 from file random_07201.tla
    3002:1 Parsing or semantic analysis failed.
---*)
