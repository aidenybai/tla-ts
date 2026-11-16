(*---
description: Evaluates a random int expression, seed 262, number 4035.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04035 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<1, 2>>) - Head(<<1, 2>>)) \div {(1 \div -1), IF TRUE THEN 7 ELSE 7}) + (Head(Append(<<1, 2>>, 3)) - CASE ({1, 2} = 1..3) -> LET b6346 == 2147483647 IN 2 [] OTHER -> (2147483647 .. 2147483647))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 61 to line 14, col 64 of module random_04035 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 59.
    | Expression starting at line 14, column 59.
    | ExtendableExpr starting at line 14, column 58.
    | Expression starting at line 14, column 58.
    | Some { } form starting at line 14, column 57.
    | Fatal errors while parsing TLA+ spec in file random_04035
    | In module random_04035
    | Could not parse module random_04035 from file random_04035.tla
    | *** Errors: 1
    | In module random_04035
    | Could not parse module random_04035 from file random_04035.tla
    3002:1 Parsing or semantic analysis failed.
---*)
