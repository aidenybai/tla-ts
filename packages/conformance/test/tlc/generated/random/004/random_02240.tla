(*---
description: Evaluates a random int expression, seed 262, number 2240.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02240 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([<<1>> EXCEPT ![1] = 2] = [b3522 \in {1} |-> 2147483647]) THEN IF (7 < 2) THEN (7 \div -1) ELSE (3 - 1) ELSE ((-2) % (-1)) - Len(SubSeq(<<0, 2147483647>>, Cardinality(2..1), LET b3523 == 3 IN 2))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 103 to line 14, col 106 of module random_02240 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 101.
    | ExtendableExpr starting at line 14, column 100.
    | Expression starting at line 14, column 100.
    | IF THEN ELSE starting at line 14, column 84.
    | Fatal errors while parsing TLA+ spec in file random_02240
    | In module random_02240
    | Could not parse module random_02240 from file random_02240.tla
    | *** Errors: 1
    | In module random_02240
    | Could not parse module random_02240 from file random_02240.tla
    3002:1 Parsing or semantic analysis failed.
---*)
